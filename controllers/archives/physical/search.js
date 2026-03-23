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

/**
 * GET /api/stuff/archives/physical/path/:level/:id
 * Retourne le chemin complet (breadcrumb) depuis la racine jusqu'à l'élément.
 */
module.exports.getPath = async (req, res) => {
    try {
        const { level, id } = req.params;
        const path = [];

        if (level === 'container') {
            const c = await Container.findById(id).lean();
            if (c) path.push({ id: c._id, label: c.name, level: 'container' });
        } else if (level === 'shelf') {
            const s = await Shelf.findById(id).populate('container', '_id name').lean();
            if (s) {
                if (s.container) path.push({ id: s.container._id, label: s.container.name, level: 'container' });
                path.push({ id: s._id, label: s.name, level: 'shelf' });
            }
        } else if (level === 'floor') {
            const f = await Floor.findById(id).populate({ path: 'shelf', select: '_id name container', populate: { path: 'container', select: '_id name' } }).lean();
            if (f) {
                if (f.shelf?.container) path.push({ id: f.shelf.container._id, label: f.shelf.container.name, level: 'container' });
                if (f.shelf) path.push({ id: f.shelf._id, label: f.shelf.name, level: 'shelf' });
                path.push({ id: f._id, label: f.label || `Niveau ${f.number}`, level: 'floor' });
            }
        } else if (level === 'binder') {
            const b = await Binder.findById(id).populate({ path: 'floor', select: '_id number label shelf', populate: { path: 'shelf', select: '_id name container', populate: { path: 'container', select: '_id name' } } }).lean();
            if (b) {
                if (b.floor?.shelf?.container) path.push({ id: b.floor.shelf.container._id, label: b.floor.shelf.container.name, level: 'container' });
                if (b.floor?.shelf) path.push({ id: b.floor.shelf._id, label: b.floor.shelf.name, level: 'shelf' });
                if (b.floor) path.push({ id: b.floor._id, label: b.floor.label || `Niveau ${b.floor.number}`, level: 'floor' });
                path.push({ id: b._id, label: b.name, level: 'binder' });
            }
        } else if (level === 'record') {
            const r = await Record.findById(id).populate({ path: 'binder', select: '_id name floor', populate: { path: 'floor', select: '_id number label shelf', populate: { path: 'shelf', select: '_id name container', populate: { path: 'container', select: '_id name' } } } }).lean();
            if (r) {
                if (r.binder?.floor?.shelf?.container) path.push({ id: r.binder.floor.shelf.container._id, label: r.binder.floor.shelf.container.name, level: 'container' });
                if (r.binder?.floor?.shelf) path.push({ id: r.binder.floor.shelf._id, label: r.binder.floor.shelf.name, level: 'shelf' });
                if (r.binder?.floor) path.push({ id: r.binder.floor._id, label: r.binder.floor.label || `Niveau ${r.binder.floor.number}`, level: 'floor' });
                if (r.binder) path.push({ id: r.binder._id, label: r.binder.name, level: 'binder' });
                path.push({ id: r._id, label: r.internalNumber, level: 'record' });
            }
        } else if (level === 'document') {
            const d = await Document.findById(id).populate({ path: 'record', select: '_id internalNumber binder', populate: { path: 'binder', select: '_id name floor', populate: { path: 'floor', select: '_id number label shelf', populate: { path: 'shelf', select: '_id name container', populate: { path: 'container', select: '_id name' } } } } }).lean();
            if (d) {
                if (d.record?.binder?.floor?.shelf?.container) path.push({ id: d.record.binder.floor.shelf.container._id, label: d.record.binder.floor.shelf.container.name, level: 'container' });
                if (d.record?.binder?.floor?.shelf) path.push({ id: d.record.binder.floor.shelf._id, label: d.record.binder.floor.shelf.name, level: 'shelf' });
                if (d.record?.binder?.floor) path.push({ id: d.record.binder.floor._id, label: d.record.binder.floor.label || `Niveau ${d.record.binder.floor.number}`, level: 'floor' });
                if (d.record?.binder) path.push({ id: d.record.binder._id, label: d.record.binder.name, level: 'binder' });
                if (d.record) path.push({ id: d.record._id, label: d.record.internalNumber, level: 'record' });
                path.push({ id: d._id, label: d.title, level: 'document' });
            }
        }

        res.status(200).json({ path });
    } catch (error) {
        console.error('[physical/path]', error);
        res.status(500).json({ error: 'Erreur.' });
    }
};

module.exports.search = async (req, res) => {
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
