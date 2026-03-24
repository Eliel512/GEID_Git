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

// ─── Helper — Recherche tolérante (accents, fautes légères) ─────────────────

/**
 * Normalise une chaîne : retire les accents pour une recherche tolérante.
 */
function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Construit une regex tolérante aux accents et aux petites variations.
 * Chaque caractère est rendu optionnel avec ses variantes accentuées.
 */
function buildFuzzyRegex(q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remplacer chaque lettre par sa classe de caractères avec accents
    const pattern = stripAccents(escaped).split('').map(c => {
        const map = {
            a: '[aàâäáãå]', e: '[eèéêë]', i: '[iìîï]', o: '[oòôöõ]',
            u: '[uùûü]', c: '[cç]', n: '[nñ]', y: '[yÿ]',
        };
        return map[c.toLowerCase()] || c;
    }).join('');
    return new RegExp(pattern, 'i');
}

/**
 * Lance une recherche $text sur le modèle Mongoose donné.
 * En cas d'erreur (index absent, etc.), retombe sur une recherche regex.
 */
async function textSearch(Model, q, filter = {}, select = {}, limit = 20) {
    try {
        const results = await Model
            .find({ $text: { $search: q }, ...filter }, { score: { $meta: 'textScore' }, ...select })
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean();
        // Si $text retourne peu de résultats, compléter avec regex floue
        if (results.length < limit) {
            const existingIds = new Set(results.map(r => r._id.toString()));
            const fuzzyResults = await fallbackRegex(Model, q, filter, select, limit);
            for (const r of fuzzyResults) {
                if (!existingIds.has(r._id.toString())) {
                    results.push(r);
                    if (results.length >= limit) break;
                }
            }
        }
        return results;
    } catch (_err) {
        return fallbackRegex(Model, q, filter, select, limit);
    }
}

/**
 * Recherche par regex tolérante aux accents sur les champs textuels.
 */
async function fallbackRegex(Model, q, filter, select, limit) {
    const regex = buildFuzzyRegex(q);
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
