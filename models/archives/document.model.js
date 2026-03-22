'use strict';

/**
 * models/archives/document.model.js
 *
 * Modèle Mongoose — Document physique (niveau 6 de la hiérarchie physique)
 *
 * Le document est une subdivision du dossier (Record). Un dossier physique
 * peut contenir un ou plusieurs documents. Chaque document peut contenir
 * un ou plusieurs archives numériques ET/OU d'autres sous-documents.
 *
 * ─── Position dans la hiérarchie ─────────────────────────────────────────────
 *
 *   Conteneur  (container.model.js)
 *       └── Étagère  (shelf.model.js)
 *               └── Étage  (floor.model.js)
 *                       └── Classeur  (binder.model.js)
 *                               └── Dossier  (record.model.js)
 *                                       └── [Document]  ← ce modèle
 *                                               ├── Archive  (archive.model.js)
 *                                               └── Document  (récursif)
 *
 * ─── Relations ───────────────────────────────────────────────────────────────
 *   - record (obligatoire) : référence vers le dossier parent
 *   - parent (optionnel)   : référence vers un document parent (sous-documents)
 *   - Les archives numériques référencent ce document via archive.document
 */

const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const isValidObjectId = require('../../tools/isValidObjectId');

// ─── Schéma ──────────────────────────────────────────────────────────────────

const documentSchema = new Schema(
    {
        /**
         * Titre du document.
         * Exemple : "Contrat de travail", "Avenant n°2", "PV de réunion".
         */
        title: {
            type: String,
            required: [true, "Le champ 'title' est requis"]
        },

        /**
         * Description du contenu du document.
         */
        description: {
            type: String,
            required: false,
            default: ''
        },

        /**
         * Référence vers le dossier physique parent (_id du modèle Record).
         * Chaque document appartient à un dossier.
         */
        record: {
            type: String,
            ref: 'record',
            validate: {
                validator: v => isValidObjectId(v),
                message: () => "Au champ 'record' doit correspondre un _id de dossier valide"
            },
            required: [true, "Le champ 'record' est requis"]
        },

        /**
         * Référence vers un document parent (sous-documents imbriqués).
         * Si null/absent, le document est au premier niveau du dossier.
         * Si renseigné, c'est un sous-document.
         */
        parent: {
            type: String,
            ref: 'document',
            validate: {
                validator: v => !v || isValidObjectId(v),
                message: () => "Au champ 'parent' doit correspondre un _id de document valide"
            },
            required: false
        },

        /**
         * Nature/type du document.
         * Exemple : "CONTRAT", "PV", "FACTURE", "CORRESPONDANCE".
         * Automatiquement convertie en majuscules.
         */
        nature: {
            type: String,
            required: false,
            set: v => v ? v.toUpperCase() : v
        },

        /**
         * Date du document (date figurant sur le document lui-même).
         */
        documentDate: {
            type: Date,
            required: false
        },

        /**
         * Agent ayant créé l'entrée dans le système.
         * Renseigné automatiquement via res.locals.userId.
         */
        agent: {
            type: String,
            ref: 'users',
            validate: {
                validator: v => isValidObjectId(v),
                message: () => "Au champ 'agent' doit correspondre un _id d'utilisateur valide"
            },
            required: [true, "Le champ 'agent' est requis"]
        },

        /**
         * Métadonnées libres — champ JSON extensible.
         */
        metadata: {
            type: Schema.Types.Mixed,
            required: false
        }
    },
    {
        timestamps: true
    }
);

// ─── Plugin — validation d'unicité lisible ───────────────────────────────────
documentSchema.plugin(uniqueValidator);

// ─── Index pour recherche par dossier et par parent ──────────────────────────
documentSchema.index({ record: 1, parent: 1 });

// ─── Index de recherche plein-texte ──────────────────────────────────────────
documentSchema.index(
    {
        title:       'text',
        description: 'text',
    },
    {
        weights: { title: 10, description: 1 },
        name: 'document_text_search',
    }
);

// ─── Export du modèle ────────────────────────────────────────────────────────
const Document = mongoose.model('document', documentSchema);

module.exports = Document;
