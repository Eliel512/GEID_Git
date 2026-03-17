'use strict';

/**
 * models/archives/binder.model.js
 *
 * Modèle Mongoose — Classeur (niveau 4 de la hiérarchie physique)
 *
 * Un classeur est le conteneur direct des dossiers physiques. Il est positionné
 * sur un étage d'une étagère et possède deux contraintes métier fondamentales :
 *
 *   1. NATURE    — Chaque classeur est spécialisé dans un seul type de dossiers
 *                  (ex : "RH", "FINANCE", "JURIDIQUE"). Un dossier ne peut y être
 *                  rangé que si sa nature correspond exactement à celle du classeur.
 *
 *   2. CAPACITÉ  — Chaque classeur a un nombre maximal de dossiers (`maxCapacity`).
 *                  L'ajout d'un dossier est refusé dès que ce seuil est atteint.
 *                  Le taux de remplissage courant est calculé dynamiquement dans
 *                  le contrôleur (non stocké dans le modèle).
 *
 * ─── Position dans la hiérarchie ─────────────────────────────────────────────
 *
 *   Conteneur  (container.model.js)
 *       └── Étagère  (shelf.model.js)
 *               └── Étage  (floor.model.js)
 *                       └── [Classeur]  ← ce modèle
 *                               └── Dossier  (record.model.js)
 *                                       └── Archive  (archive.model.js)
 *
 * ─── Règles métier (enforced dans record.controller.js) ──────────────────────
 *   - Lors de la création d'un dossier :
 *       dossier.nature === classeur.nature          (sinon → HTTP 422)
 *       count(dossiers du classeur) < maxCapacity   (sinon → HTTP 422)
 *   - Lors de la suppression d'un classeur :
 *       le classeur doit être vide de tout dossier  (sinon → HTTP 409)
 */

const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const isValidObjectId = require('../../tools/isValidObjectId');

// ─── Schéma ──────────────────────────────────────────────────────────────────

const binderSchema = new Schema(
    {
        /**
         * Nom du classeur.
         * Exemple : "CLASSEUR-RH-01", "FINANCE-2023-A".
         * Automatiquement converti en majuscules avant la sauvegarde.
         */
        name: {
            type: String,
            required: [true, "Le champ 'name' est requis"],
            set: v => v.toUpperCase()
        },

        /**
         * Référence vers l'étage parent (_id du modèle Floor).
         * Définit la position physique du classeur dans la hiérarchie.
         * Validé comme ObjectId MongoDB avant persistance.
         */
        floor: {
            type: String,
            ref: 'floor',
            validate: {
                validator: v => isValidObjectId(v),
                message: () => "Au champ 'floor' doit correspondre un _id de floor valide"
            },
            required: [true, "Le champ 'floor' est requis"]
        },

        /**
         * Nature / spécialité du classeur.
         * Détermine quels types de dossiers peuvent y être rangés.
         * Exemples de valeurs : "RH", "FINANCE", "JURIDIQUE", "TECHNIQUE".
         * Automatiquement converti en majuscules avant la sauvegarde.
         *
         * IMPORTANT : la nature d'un dossier doit correspondre exactement
         * à la nature de son classeur cible (règle vérifiée dans le contrôleur).
         */
        nature: {
            type: String,
            required: [true, "Le champ 'nature' est requis"],
            set: v => v.toUpperCase()
        },

        /**
         * Capacité maximale du classeur (nombre de dossiers autorisés).
         * Valeur entière, minimum 1.
         * Lorsque le nombre de dossiers atteint cette limite, tout nouvel
         * ajout est refusé avec une erreur HTTP 422.
         */
        maxCapacity: {
            type: Number,
            required: [true, "Le champ 'maxCapacity' est requis"],
            min: [1, "La capacité maximale doit être au moins 1"]
        }
    },
    {
        // Ajoute automatiquement les champs `createdAt` et `updatedAt`
        timestamps: true
    }
);

// ─── Plugin — validation d'unicité lisible ───────────────────────────────────
binderSchema.plugin(uniqueValidator);

// ─── Export du modèle ────────────────────────────────────────────────────────
const Binder = mongoose.model('binder', binderSchema);

module.exports = Binder;
