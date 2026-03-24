'use strict';

/**
 * models/archives/record.model.js
 *
 * Modèle Mongoose — Dossier physique (niveau 5 de la hiérarchie physique)
 *
 * Le dossier est l'entité pivot du système d'archivage physique. Il représente
 * le dossier cartonné réel que l'on place dans un classeur. Chaque dossier
 * possède un identifiant unique (QR code) qui assure le lien entre le support
 * physique et sa fiche numérique dans le logiciel.
 *
 * ─── Position dans la hiérarchie ─────────────────────────────────────────────
 *
 *   Conteneur  (container.model.js)
 *       └── Étagère  (shelf.model.js)
 *               └── Étage  (floor.model.js)
 *                       └── Classeur  (binder.model.js)
 *                               └── [Dossier]  ← ce modèle
 *                                       └── Archive  (archive.model.js)
 *
 * ─── Lien physique-numérique (QR code) ───────────────────────────────────────
 *   À la création, un UUID v4 est automatiquement généré via `crypto.randomUUID()`
 *   et stocké dans le champ `qrCode`. Cet UUID est destiné à être imprimé et
 *   collé sur le dossier cartonné physique. L'endpoint suivant permet de
 *   retrouver instantanément la fiche numérique depuis le QR code scanné :
 *
 *     GET /api/stuff/archives/physical/records/qr/:qrCode
 *
 * ─── Règles métier (enforced dans physical/record.js) ────────────────────────
 *   1. NATURE    : dossier.nature doit être identique à binder.nature.
 *                  Erreur → HTTP 422 si incompatibilité.
 *   2. CAPACITÉ  : le nombre de dossiers existants dans le classeur cible doit
 *                  être strictement inférieur à binder.maxCapacity.
 *                  Erreur → HTTP 422 si le classeur est plein.
 *   3. AGENT     : automatiquement renseigné avec l'utilisateur connecté
 *                  (res.locals.userId), non fourni par le client.
 *
 * ─── Métadonnées flexibles ────────────────────────────────────────────────────
 *   Le champ `metadata` de type Mixed (JSON libre) permet d'enregistrer toute
 *   information complémentaire non prévue dans le schéma standard, sans avoir
 *   à modifier la structure de la base de données. Exemples : visa du responsable,
 *   niveau de confidentialité, tags personnalisés, etc.
 */

const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const isValidObjectId = require('../../tools/isValidObjectId');

// ─── Schéma ──────────────────────────────────────────────────────────────────

const recordSchema = new Schema(
    {
        /**
         * Numéro interne du dossier, propre au logiciel.
         * Attribué par l'organisation selon sa propre nomenclature.
         * Exemple : "DOS-2024-0042", "DRH-2024-001".
         * Doit être unique dans toute la collection.
         */
        internalNumber: {
            type: String,
            required: [true, "Le champ 'internalNumber' est requis"],
            unique: true
        },

        /**
         * Numéro de référence externe du dossier.
         * Correspond à un identifiant provenant d'un système tiers, d'un
         * courrier officiel ou d'une procédure administrative externe.
         * Exemple : "REF-MINISTERE-2024-007", "CONTRAT-EXT-99".
         */
        refNumber: {
            type: String,
            required: [true, "Le champ 'refNumber' est requis"]
        },

        /**
         * Date d'édition (création) du document physique contenu dans le dossier.
         * Correspond à la date figurant sur le document lui-même, non à la date
         * de numérisation ou d'archivage.
         * Exemple : 2024-01-15
         */
        editionDate: {
            type: Date,
            required: [true, "Le champ 'editionDate' est requis"]
        },

        /**
         * Date à laquelle le dossier a été physiquement placé en archive.
         * Peut différer de `editionDate` si le document a été conservé
         * en circulation avant d'être archivé.
         * Exemple : 2024-03-01
         */
        archivingDate: {
            type: Date,
            required: [true, "Le champ 'archivingDate' est requis"]
        },

        /**
         * Objet / sujet principal du dossier.
         * Résumé court décrivant le contenu ou la finalité du dossier.
         * Exemple : "Contrat de travail — Jean Dupont", "Marché public n°2024-05".
         */
        subject: {
            type: String,
            required: [true, "Le champ 'subject' est requis"]
        },

        /**
         * Catégorie du dossier selon la classification interne de l'organisation.
         * Exemple : "Contrats", "Marchés", "Correspondances", "Décisions".
         */
        category: {
            type: String,
            required: [true, "Le champ 'category' est requis"]
        },

        /**
         * Nature du dossier.
         * Automatiquement convertie en majuscules avant la sauvegarde.
         * Exemples : "RH", "FINANCE", "JURIDIQUE", "TECHNIQUE".
         *
         * CONTRAINTE CRITIQUE : cette valeur doit correspondre exactement à
         * la nature du classeur cible (`binder.nature`). La validation est
         * effectuée dans le contrôleur avant toute écriture en base.
         */
        nature: {
            type: String,
            required: false,  // Auto-déduit depuis binder.nature par le contrôleur
            set: v => v.toUpperCase()
        },

        /**
         * Référence vers le classeur parent (_id du modèle Binder).
         * Détermine l'emplacement physique du dossier dans la hiérarchie.
         * La validation de la nature et de la capacité du classeur est
         * effectuée dans le contrôleur avant d'accepter cette référence.
         */
        binder: {
            type: String,
            ref: 'binder',
            validate: {
                validator: v => isValidObjectId(v),
                message: () => "Au champ 'binder' doit correspondre un _id de binder valide"
            },
            required: [true, "Le champ 'binder' est requis"]
        },

        /**
         * Agent ayant introduit le dossier dans le système.
         * Référence vers un utilisateur (_id du modèle users).
         * Renseigné automatiquement par le contrôleur (res.locals.userId) :
         * le client n'a pas à fournir cette valeur dans le corps de la requête.
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
         * Code QR — identifiant unique du dossier physique.
         * UUID v4 généré automatiquement à la création via `crypto.randomUUID()`.
         * Destiné à être imprimé et collé sur le dossier cartonné physique.
         * Permet de retrouver instantanément la fiche numérique en scannant le QR.
         * Valeur unique dans toute la collection, non modifiable après création.
         */
        qrCode: {
            type: String,
            unique: true,
            required: false   // généré côté serveur, jamais envoyé par le client
        },

        /**
         * Métadonnées libres — champ JSON extensible.
         * Permet d'ajouter des informations complémentaires sans modification
         * du schéma. Chaque organisation peut y stocker ses propres attributs.
         * Exemples :
         *   { "visa": "DRH", "urgent": true }
         *   { "cote": "A-12-RH", "confidentiel": false, "nbPages": 42 }
         */
        metadata: {
            type: Schema.Types.Mixed,
            required: false
        }
    },
    {
        // Ajoute automatiquement les champs `createdAt` et `updatedAt`
        timestamps: true
    }
);

// ─── Plugin — validation d'unicité lisible ───────────────────────────────────
// Remplace l'erreur native MongoDB E11000 par un message compréhensible pour
// les champs `internalNumber` et `qrCode` déclarés unique.
recordSchema.plugin(uniqueValidator);

// ─── Index de recherche plein-texte ──────────────────────────────────────────
// Permet d'utiliser $text dans les requêtes de recherche unifiée.
// Les poids donnent la priorité au numéro interne puis au sujet.
recordSchema.index(
    {
        internalNumber: 'text',
        refNumber:      'text',
        subject:        'text',
        category:       'text',
        nature:         'text',
    },
    {
        weights: { internalNumber: 10, subject: 5, refNumber: 3, category: 2, nature: 1 },
        name: 'record_text_search',
    }
);

// ─── Export du modèle ────────────────────────────────────────────────────────
const Record = mongoose.model('record', recordSchema);

module.exports = Record;
