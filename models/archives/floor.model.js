'use strict';

/**
 * models/archives/floor.model.js
 *
 * Modèle Mongoose — Étage / Niveau (niveau 3 de la hiérarchie physique)
 *
 * Un étage représente un niveau numéroté à l'intérieur d'une étagère.
 * C'est le pont entre la localisation physique (étagère → conteneur) et
 * l'organisation administrative (unité administrative / rôle).
 * Grâce à ce lien double, on peut répondre à la question :
 * "Sur quelle étagère et pour quelle unité se trouvent les classeurs ?"
 *
 * ─── Position dans la hiérarchie ─────────────────────────────────────────────
 *
 *   Conteneur  (container.model.js)
 *       └── Étagère  (shelf.model.js)
 *               └── [Étage]  ← ce modèle
 *                       └── Classeur  (binder.model.js)
 *                               └── Dossier  (record.model.js)
 *                                       └── Archive  (archive.model.js)
 *
 * ─── Double rattachement ─────────────────────────────────────────────────────
 *   - `shelf`              → localisation physique (où se trouve l'étage)
 *   - `administrativeUnit` → propriétaire organisationnel (qui gère cet étage)
 *
 * ─── Contraintes ─────────────────────────────────────────────────────────────
 *   - `number` et `shelf` et `administrativeUnit` sont tous obligatoires.
 *   - Les deux champs de référence sont validés comme ObjectId avant
 *     d'être persistés.
 */

const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const isValidObjectId = require('../../tools/isValidObjectId');

// ─── Schéma ──────────────────────────────────────────────────────────────────

const floorSchema = new Schema(
    {
        /**
         * Numéro d'ordre de l'étage dans l'étagère parente.
         * Valeur entière positive. Exemple : 1, 2, 3…
         * Permet de trier les étages et de les présenter dans l'ordre physique.
         */
        number: {
            type: Number,
            required: [true, "Le champ 'number' est requis"]
        },

        /**
         * Libellé descriptif optionnel de l'étage.
         * Exemple : "Niveau 2 — Ressources Humaines 2019-2023".
         * Utile pour donner du sens au numéro dans l'interface utilisateur.
         */
        label: {
            type: String,
            required: false
        },

        /**
         * Référence vers l'étagère parente (_id du modèle Shelf).
         * Rattache physiquement cet étage à son étagère dans la hiérarchie.
         * Validé comme ObjectId MongoDB avant persistance.
         */
        shelf: {
            type: String,
            ref: 'shelf',
            validate: {
                validator: v => isValidObjectId(v),
                message: () => "Au champ 'shelf' doit correspondre un _id de shelf valide"
            },
            required: [true, "Le champ 'shelf' est requis"]
        },

        /**
         * Référence vers l'unité administrative responsable de cet étage.
         * Correspond à un _id du modèle Role (rôle organisationnel).
         * Permet de savoir quelle direction ou service gère cet espace.
         * Validé comme ObjectId MongoDB avant persistance.
         */
        administrativeUnit: {
            type: String,
            ref: 'roles',
            validate: {
                validator: v => isValidObjectId(v),
                message: () => "Au champ 'administrativeUnit' doit correspondre un _id de role valide"
            },
            required: [true, "Le champ 'administrativeUnit' est requis"]
        }
    },
    {
        // Ajoute automatiquement les champs `createdAt` et `updatedAt`
        timestamps: true
    }
);

// ─── Plugin — validation d'unicité lisible ───────────────────────────────────
floorSchema.plugin(uniqueValidator);

// ─── Export du modèle ────────────────────────────────────────────────────────
const Floor = mongoose.model('floor', floorSchema);

module.exports = Floor;
