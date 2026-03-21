'use strict';

/**
 * controllers/archives/search.js
 *
 * Contrôleur — Recherche unifiée (Archives numériques + Documents physiques)
 *
 * Endpoint : GET /api/stuff/archives/search?q=<termes>&limit=<n>&type=<all|archive|record>
 *
 * Stratégie d'indexation :
 *   1. Recherche $text MongoDB si l'index plein-texte est disponible
 *      → score de pertinence trié par { score: { $meta: "textScore" } }
 *   2. Fallback regex (insensible à la casse) si $text échoue ou si l'index
 *      n'a pas encore été construit (premier démarrage)
 *
 * Paramètres de la requête :
 *   q      {string}  — termes à rechercher (obligatoire, min. 2 caractères)
 *   limit  {number}  — nombre max de résultats par type (défaut 20, max 50)
 *   type   {string}  — filtre : "all" | "archive" | "record" (défaut "all")
 *
 * Réponse :
 *   {
 *     query:    string,          // termes soumis
 *     total:    number,          // nombre total de résultats
 *     archives: Archive[],       // résultats archives numériques
 *     records:  PhysicalRecord[] // résultats documents physiques
 *   }
 */

const Archive = require('../../models/archives/archive.model');
const Record  = require('../../models/archives/record.model');

// ─── Helper — Recherche $text avec fallback regex ─────────────────────────────

/**
 * Lance une recherche $text sur le modèle Mongoose donné.
 * En cas d'erreur (index absent, etc.), retombe sur une recherche regex.
 *
 * @param {mongoose.Model}    Model    - Modèle Mongoose cible
 * @param {string}            q        - Chaîne de recherche
 * @param {object}            filter   - Filtre Mongoose additionnel
 * @param {object}            select   - Projection des champs
 * @param {number}            limit    - Nombre max de documents
 * @returns {Promise<object[]>}
 */
async function textSearch(Model, q, filter = {}, select = {}, limit = 20) {
    try {
        return await Model
            .find({ $text: { $search: q }, ...filter }, { score: { $meta: 'textScore' }, ...select })
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean();
    } catch (_err) {
        // Fallback regex — tolère les collections sans index $text encore actif
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return fallbackRegex(Model, q, regex, filter, select, limit);
    }
}

/**
 * Fallback : cherche par regex sur les champs textuels principaux du modèle.
 *
 * @param {mongoose.Model} Model
 * @param {string}         q
 * @param {RegExp}         regex
 * @param {object}         filter
 * @param {object}         select
 * @param {number}         limit
 * @returns {Promise<object[]>}
 */
async function fallbackRegex(Model, q, regex, filter, select, limit) {
    const collectionName = Model.collection.collectionName;
    let orFields = [];

    if (collectionName === 'archives') {
        orFields = [
            { designation: regex },
            { description: regex },
            { folder:       regex },
            { classNumber:  regex },
            { refNumber:    regex },
            { tags:         regex },
        ];
    } else {
        // records
        orFields = [
            { internalNumber: regex },
            { refNumber:      regex },
            { subject:        regex },
            { category:       regex },
            { nature:         regex },
        ];
    }

    return Model
        .find({ $or: orFields, ...filter }, select)
        .limit(limit)
        .lean();
}

// ─── Contrôleur principal ─────────────────────────────────────────────────────

module.exports = async (req, res) => {
    try {
        const q     = (req.query.q     || '').trim();
        const type  = (req.query.type  || 'all').toLowerCase();
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

        // Validation minimale
        if (q.length < 2) {
            return res.status(400).json({
                error: 'Le paramètre "q" doit contenir au moins 2 caractères.',
            });
        }

        let archives = [];
        let records  = [];

        // ── Recherche dans les archives numériques ────────────────────────────
        if (type === 'all' || type === 'archive') {
            archives = await textSearch(
                Archive,
                q,
                {},
                { designation: 1, description: 1, folder: 1, classNumber: 1, refNumber: 1,
                  status: 1, tags: 1, administrativeUnit: 1, record: 1, fileUrl: 1, createdAt: 1 },
                limit
            );
        }

        // ── Recherche dans les documents physiques (records) ──────────────────
        if (type === 'all' || type === 'record') {
            records = await textSearch(
                Record,
                q,
                {},
                { internalNumber: 1, refNumber: 1, subject: 1, category: 1, nature: 1,
                  binder: 1, qrCode: 1, editionDate: 1, archivingDate: 1, createdAt: 1 },
                limit
            );
        }

        res.status(200).json({
            query:    q,
            total:    archives.length + records.length,
            archives,
            records,
        });
    } catch (error) {
        console.error('[search]', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la recherche.' });
    }
};
