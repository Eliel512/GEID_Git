'use strict';

/**
 * controllers/archives/physical/search.js
 *
 * Recherche unifiée sur tous les niveaux de la hiérarchie physique.
 *
 * GET /api/stuff/archives/physical/search?q=<termes>&limit=<n>
 *
 * Cherche par regex (insensible à la casse) dans :
 *   - Containers (name, location, description)
 *   - Shelves (name, description)
 *   - Floors (label)
 *   - Binders (name, nature)
 *   - Records (internalNumber, refNumber, subject, category, nature) — $text si disponible
 *   - Documents (title, description, nature)
 *
 * Réponse groupée par niveau avec le type de chaque résultat.
 */

const Container = require('../../../models/archives/container.model');
const Shelf     = require('../../../models/archives/shelf.model');
const Floor     = require('../../../models/archives/floor.model');
const Binder    = require('../../../models/archives/binder.model');
const Record    = require('../../../models/archives/record.model');
const Document  = require('../../../models/archives/document.model');
const Archive   = require('../../../models/archives/archive.model');

module.exports = async (req, res) => {
    try {
        const q     = (req.query.q || '').trim();
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

        if (q.length < 2) {
            return res.status(400).json({ error: 'Le paramètre "q" doit contenir au moins 2 caractères.' });
        }

        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        // Chercher dans tous les niveaux en parallèle
        const [containers, shelves, floors, binders, records, documents, archives] = await Promise.all([
            Container.find({ $or: [{ name: regex }, { location: regex }, { description: regex }] })
                .select('name location description createdAt').limit(limit).lean(),
            Shelf.find({ $or: [{ name: regex }, { description: regex }] })
                .select('name description container createdAt').limit(limit).lean(),
            Floor.find({ $or: [{ label: regex }] })
                .select('number label shelf administrativeUnit createdAt').limit(limit).lean(),
            Binder.find({ $or: [{ name: regex }, { nature: regex }] })
                .select('name nature maxCapacity floor createdAt').limit(limit).lean(),
            Record.find({ $or: [{ internalNumber: regex }, { refNumber: regex }, { subject: regex }, { category: regex }, { nature: regex }] })
                .select('internalNumber refNumber subject category nature binder qrCode createdAt').limit(limit).lean(),
            Document.find({ $or: [{ title: regex }, { description: regex }, { nature: regex }] })
                .select('title description nature record parent createdAt').limit(limit).lean(),
            Archive.find({ $or: [{ designation: regex }, { description: regex }, { classNumber: regex }, { refNumber: regex }, { tags: regex }] })
                .select('designation description classNumber refNumber status validated folder createdAt').limit(limit).lean(),
        ]);

        // Formater les résultats avec le type de chaque élément
        const results = [
            ...containers.map(c => ({ ...c, _level: 'container', _label: c.name })),
            ...shelves.map(s => ({ ...s, _level: 'shelf', _label: s.name })),
            ...floors.map(f => ({ ...f, _level: 'floor', _label: f.label || `Niveau ${f.number}` })),
            ...binders.map(b => ({ ...b, _level: 'binder', _label: b.name })),
            ...records.map(r => ({ ...r, _level: 'record', _label: r.internalNumber })),
            ...documents.map(d => ({ ...d, _level: 'document', _label: d.title })),
            ...archives.map(a => ({ ...a, _level: 'archive', _label: a.designation })),
        ];

        res.status(200).json({
            query: q,
            total: results.length,
            results,
        });
    } catch (error) {
        console.error('[physical/search]', error);
        res.status(500).json({ error: 'Erreur lors de la recherche.' });
    }
};
