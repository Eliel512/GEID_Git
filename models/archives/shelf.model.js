'use strict';

/**
 * models/archives/shelf.model.js
 *
 * Modèle Mongoose — Étagère / Rayon (niveau 2 de la hiérarchie physique)
 *
 * Une étagère est un sous-compartiment d'un conteneur. Elle regroupe
 * plusieurs étages, chacun pouvant être associé à une unité administrative.
 * Concrètement, il peut s'agir d'une travée, d'un rayon ou d'un casier
 * numéroté à l'intérieur d'une armoire.
 *
 * ─── Position dans la hiérarchie ─────────────────────────────────────────────
 *
 *   Conteneur  (container.model.js)
 *       └── [Étagère]  ← ce modèle
 *               └── Étage  (floor.model.js)
 *                       └── Classeur  (binder.model.js)
 *                               └── Dossier  (record.model.js)
 *                                       └── Archive  (archive.model.js)
 *
 * ─── Contraintes ─────────────────────────────────────────────────────────────
 *   - Le champ `container` est obligatoire : toute étagère doit appartenir à
 *     un conteneur existant (référence par ObjectId).
 *   - Le champ `name` est converti en majuscules avant la sauvegarde.
 *   - Aucune suppression en cascade automatique : gérer la politique de
 *     suppression au niveau du contrôleur si des étages sont rattachés.
 */

const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator  = require('mongoose-unique-validator');
const isValidObjectId  = require('../../tools/isValidObjectId');

// ─── Schéma ──────────────────────────────────────────────────────────────────

const shelfSchema = new Schema(
    {
        /**
         * Nom de l'étagère.
         * Exemple : "ETAGERE-01", "RAYON-NORD-A".
         * Automatiquement converti en majuscules avant la sauvegarde.
         */
        name: {
            type: String,
            required: [true, "Le champ 'name' est requis"],
            set: v => v.toUpperCase()
        },

        /**
         * Référence vers le conteneur parent (_id du modèle Container).
         * Définit l'appartenance physique de l'étagère dans la hiérarchie.
         * Le validateur s'assure que la valeur est un ObjectId MongoDB valide
         * avant d'essayer de résoudre la référence en base.
         */
        container: {
            type: String,
            ref: 'container',
            validate: {
                validator: v => isValidObjectId(v),
                message: () => "Au champ 'container' doit correspondre un _id de container valide"
            },
            required: [true, "Le champ 'container' est requis"]
        },

        /**
         * Description libre de l'étagère.
         * Exemple : "Travée gauche — documents RH 2020-2022".
         * Champ facultatif.
         */
        description: {
            type: String,
            required: false
        }
    },
    {
        // Ajoute automatiquement les champs `createdAt` et `updatedAt`
        timestamps: true
    }
);

// ─── Plugin — validation d'unicité lisible ───────────────────────────────────
// Remplace l'erreur native MongoDB E11000 par un message compréhensible.
shelfSchema.plugin(uniqueValidator);

// ─── Export du modèle ────────────────────────────────────────────────────────
const Shelf = mongoose.model('shelf', shelfSchema);

module.exports = Shelf;
