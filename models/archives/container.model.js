'use strict';

/**
 * models/archives/container.model.js
 *
 * Modèle Mongoose — Conteneur (niveau racine de la hiérarchie physique)
 *
 * Un conteneur représente l'unité de stockage physique de plus haut niveau :
 * typiquement une armoire, une salle d'archives, un meuble ou tout espace
 * délimité capable d'accueillir plusieurs étagères.
 *
 * ─── Position dans la hiérarchie ─────────────────────────────────────────────
 *
 *   [Conteneur]  ← niveau racine (ce modèle)
 *       └── Étagère  (shelf.model.js)
 *               └── Étage  (floor.model.js)
 *                       └── Classeur  (binder.model.js)
 *                               └── Dossier  (record.model.js)
 *                                       └── Archive  (archive.model.js)
 *
 * ─── Contraintes ─────────────────────────────────────────────────────────────
 *   - Le champ `name` est obligatoire, unique et automatiquement converti en
 *     majuscules (ex : "armoire-a" → "ARMOIRE-A").
 *   - Un conteneur ne peut pas être supprimé si des étagères lui sont rattachées
 *     (à gérer au niveau du contrôleur).
 */

const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// ─── Schéma ──────────────────────────────────────────────────────────────────

const containerSchema = new Schema(
    {
        /**
         * Nom du conteneur.
         * Exemple : "ARMOIRE-A", "SALLE-ARCHIVES-B3".
         * Automatiquement converti en majuscules avant la sauvegarde.
         * Doit être unique dans toute la collection.
         */
        name: {
            type: String,
            required: [true, "Le champ 'name' est requis"],
            set: v => v.toUpperCase(),
            unique: true
        },

        /**
         * Description libre du conteneur.
         * Permet d'indiquer des informations complémentaires : dimensions,
         * couleur, identifiant interne propre à l'établissement, etc.
         * Champ facultatif.
         */
        description: {
            type: String,
            required: false
        },

        /**
         * Localisation physique du conteneur dans les locaux.
         * Exemple : "Bâtiment principal, salle 102", "Sous-sol, couloir Nord".
         * Champ facultatif mais fortement recommandé pour la traçabilité.
         */
        location: {
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
containerSchema.plugin(uniqueValidator);

// ─── Export du modèle ────────────────────────────────────────────────────────
const Container = mongoose.model('container', containerSchema);

module.exports = Container;
