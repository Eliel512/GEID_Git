'use strict';

/**
 * controllers/archives/physical/document.js
 *
 * Contrôleur CRUD — Document physique
 *
 * Un document est une subdivision d'un dossier (Record). Il peut contenir
 * des archives numériques et/ou des sous-documents (récursif).
 *
 * ─── Routes associées (physical.routes.js) ───────────────────────────────────
 *   GET    /documents                           → getAll
 *   GET    /documents/record/:recordId          → getAllByRecord
 *   GET    /documents/parent/:parentId          → getChildren (sous-documents)
 *   GET    /documents/:id                       → getOne
 *   GET    /documents/:id/archives              → getArchives (archives liées)
 *   POST   /documents                           → create
 *   PUT    /documents/:id                       → update
 *   DELETE /documents/:id                       → delete
 */

const Document = require('../../../models/archives/document.model');
const Record   = require('../../../models/archives/record.model');
const Archive  = require('../../../models/archives/archive.model');

// ─── getAll ─────────────────────────────────────────────────────────────────

exports.getAll = (_req, res) => {
    Document.find()
        .populate('record', '_id internalNumber subject')
        .populate('agent', '_id firstName lastName')
        .populate('parent', '_id title')
        .then(docs => res.status(200).json(docs))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getAllByRecord ──────────────────────────────────────────────────────────

/**
 * Récupère les documents de premier niveau d'un dossier (parent = null).
 */
exports.getAllByRecord = (req, res) => {
    Document.find({ record: req.params.recordId, parent: { $in: [null, undefined] } })
        .populate('agent', '_id firstName lastName')
        .sort({ createdAt: -1 })
        .then(docs => res.status(200).json(docs))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getChildren ────────────────────────────────────────────────────────────

/**
 * Récupère les sous-documents d'un document parent.
 */
exports.getChildren = (req, res) => {
    Document.find({ parent: req.params.parentId })
        .populate('agent', '_id firstName lastName')
        .sort({ createdAt: -1 })
        .then(docs => res.status(200).json(docs))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getOne ─────────────────────────────────────────────────────────────────

exports.getOne = (req, res) => {
    Document.findById(req.params.id)
        .populate({
            path: 'record',
            select: '_id internalNumber subject binder qrCode',
            populate: {
                path: 'binder',
                select: '_id name nature floor'
            }
        })
        .populate('agent', '_id firstName lastName')
        .populate('parent', '_id title')
        .then(doc => {
            if (!doc) return res.status(404).json({ message: 'Document introuvable' });
            res.status(200).json(doc);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getArchives ────────────────────────────────────────────────────────────

/**
 * Récupère les archives numériques liées à un document.
 */
exports.getArchives = (req, res) => {
    Archive.find({ document: req.params.id })
        .select('designation description folder classNumber refNumber status tags dua fileUrl validated createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean()
        .then(archives => {
            res.status(200).json({
                document: req.params.id,
                count: archives.length,
                archives
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── create ─────────────────────────────────────────────────────────────────

exports.create = async (req, res) => {
    try {
        // Vérifier que le dossier parent existe
        const record = await Record.findById(req.body.record);
        if (!record) {
            return res.status(404).json({ message: 'Dossier introuvable' });
        }

        // Si un parent document est spécifié, vérifier qu'il existe et appartient au même dossier
        if (req.body.parent) {
            const parentDoc = await Document.findById(req.body.parent);
            if (!parentDoc) {
                return res.status(404).json({ message: 'Document parent introuvable' });
            }
            if (String(parentDoc.record) !== String(req.body.record)) {
                return res.status(422).json({
                    message: 'Le document parent doit appartenir au même dossier'
                });
            }
        }

        const doc = new Document({
            title:        req.body.title,
            description:  req.body.description,
            record:       req.body.record,
            parent:       req.body.parent || null,
            nature:       req.body.nature,
            documentDate: req.body.documentDate,
            agent:        res.locals.userId,
            metadata:     req.body.metadata
        });

        const saved = await doc.save();
        res.status(201).json(saved);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

// ─── update ─────────────────────────────────────────────────────────────────

exports.update = async (req, res) => {
    try {
        // Si on change le parent, vérifier la cohérence
        if (req.body.parent) {
            const existing = await Document.findById(req.params.id);
            if (!existing) return res.status(404).json({ message: 'Document introuvable' });

            // Empêcher un document d'être son propre parent
            if (String(req.body.parent) === String(req.params.id)) {
                return res.status(422).json({ message: 'Un document ne peut pas être son propre parent' });
            }

            const parentDoc = await Document.findById(req.body.parent);
            if (!parentDoc) {
                return res.status(404).json({ message: 'Document parent introuvable' });
            }
            if (String(parentDoc.record) !== String(existing.record)) {
                return res.status(422).json({
                    message: 'Le document parent doit appartenir au même dossier'
                });
            }
        }

        const updated = await Document.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Document introuvable' });
        res.status(200).json(updated);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

// ─── delete ─────────────────────────────────────────────────────────────────

/**
 * Supprime un document. Bloqué si des sous-documents existent.
 * Les archives liées deviennent orphelines (document ref cassée).
 */
exports.delete = async (req, res) => {
    try {
        // Vérifier qu'il n'y a pas de sous-documents
        const childCount = await Document.countDocuments({ parent: req.params.id });
        if (childCount > 0) {
            return res.status(409).json({
                message: `Impossible de supprimer : ce document contient ${childCount} sous-document(s)`
            });
        }

        const deleted = await Document.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Document introuvable' });
        res.status(200).json({ message: 'Document supprimé' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};
