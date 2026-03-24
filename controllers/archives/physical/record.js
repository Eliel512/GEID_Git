'use strict';

/**
 * controllers/archives/physical/record.js
 *
 * Contrôleur CRUD — Dossier physique (Record)
 *
 * Gère toutes les opérations sur les dossiers physiques, qui sont l'entité
 * pivot du système d'archivage. C'est ici que sont appliquées les deux règles
 * métier fondamentales avant toute écriture en base de données.
 *
 * ─── Hiérarchie rappel ───────────────────────────────────────────────────────
 *   Conteneur → Étagère → Étage → Classeur → [Dossier] → Archive
 *
 * ─── Routes associées (physical.routes.js) ───────────────────────────────────
 *   GET    /api/stuff/archives/physical/records                       → getAll
 *   GET    /api/stuff/archives/physical/records/binder/:binderId      → getAllByBinder
 *   GET    /api/stuff/archives/physical/records/qr/:qrCode            → getByQrCode
 *   GET    /api/stuff/archives/physical/records/:id                   → getOne
 *   POST   /api/stuff/archives/physical/records                       → create
 *   PUT    /api/stuff/archives/physical/records/:id                   → update
 *   DELETE /api/stuff/archives/physical/records/:id                   → delete
 *
 * ─── Règles métier appliquées dans ce contrôleur ─────────────────────────────
 *
 *   1. VALIDATION DE LA NATURE
 *      Avant tout ajout (create) ou déplacement (update vers un autre classeur),
 *      on vérifie que :
 *        dossier.nature.toUpperCase() === classeur.nature
 *      Si la nature ne correspond pas → HTTP 422 Unprocessable Entity.
 *
 *   2. CONTRÔLE DE CAPACITÉ
 *      Avant tout ajout (create) ou déplacement (update vers un autre classeur),
 *      on vérifie que le nombre de dossiers existants est inférieur à la limite :
 *        Record.countDocuments({ binder }) < binder.maxCapacity
 *      Si le classeur est plein → HTTP 422 Unprocessable Entity.
 *
 * ─── Génération du QR code ──────────────────────────────────────────────────
 *   À la création, un UUID v4 est généré via `crypto.randomUUID()` (module Node.js
 *   natif, aucune dépendance externe). Ce code est stocké dans `qrCode` et est
 *   destiné à être imprimé sur le dossier cartonné physique pour assurer le lien
 *   physique-numérique via l'endpoint GET /records/qr/:qrCode.
 *
 * ─── Champ `agent` ──────────────────────────────────────────────────────────
 *   L'agent est automatiquement renseigné avec `res.locals.userId` (utilisateur
 *   authentifié via JWT). Le client n'a pas à fournir ce champ.
 */

const { randomUUID } = require('crypto');
const Record   = require('../../../models/archives/record.model');
const Binder   = require('../../../models/archives/binder.model');
const Document = require('../../../models/archives/document.model');

// ─── getAll ───────────────────────────────────────────────────────────────────

/**
 * Récupère tous les dossiers, tous classeurs confondus.
 *
 * Peuple `binder` (nom, nature, étage) et `agent` (prénom, nom) pour un
 * affichage enrichi sans requêtes supplémentaires côté client.
 *
 * @param {import('express').Request}  _req - Requête HTTP (non utilisée)
 * @param {import('express').Response} res  - Réponse HTTP
 *
 * @returns {200} Tableau JSON de tous les dossiers
 * @returns {500} Erreur serveur interne
 */
exports.getAll = (_req, res) => {
    Record.find()
        .populate('binder', '_id name nature floor')
        .populate('agent', '_id firstName lastName')
        .then(records => res.status(200).json(records))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getAllByBinder ────────────────────────────────────────────────────────────

/**
 * Récupère tous les dossiers d'un classeur spécifique.
 *
 * Utile pour afficher le contenu d'un classeur dans la vue détaillée,
 * ou pour vérifier son état de remplissage avant d'y ajouter un dossier.
 *
 * @param {import('express').Request}  req                 - Requête HTTP
 * @param {string}                     req.params.binderId - _id MongoDB du classeur
 * @param {import('express').Response} res                 - Réponse HTTP
 *
 * @returns {200} Tableau JSON des dossiers du classeur
 * @returns {500} Erreur serveur interne
 */
exports.getAllByBinder = (req, res) => {
    Record.find({ binder: req.params.binderId })
        .populate('binder', '_id name nature floor')
        .populate('agent', '_id firstName lastName')
        .then(records => res.status(200).json(records))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getOne ───────────────────────────────────────────────────────────────────

/**
 * Récupère un dossier unique avec sa chaîne hiérarchique complète.
 *
 * Effectue un populate profond (nested populate) pour reconstituer toute la
 * chaîne de localisation physique :
 *   Dossier → Classeur → Étage → { Étagère → Conteneur, Unité administrative }
 *
 * Cette vue complète permet de savoir précisément où se trouve physiquement
 * un dossier dans les locaux (ex : "Armoire A, étagère 2, niveau 3, classeur RH-01").
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du dossier
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON du dossier avec hiérarchie complète peuplée
 * @returns {404} Dossier introuvable
 * @returns {500} Erreur serveur interne
 */
exports.getOne = (req, res) => {
    Record.findById(req.params.id)
        .populate({
            path: 'binder',
            select: '_id name nature maxCapacity floor',
            populate: {
                path: 'floor',
                select: '_id number label shelf administrativeUnit',
                populate: [
                    {
                        path: 'shelf',
                        select: '_id name container',
                        // Populate en cascade jusqu'au conteneur racine
                        populate: { path: 'container', select: '_id name location' }
                    },
                    // Peuple également l'unité administrative de l'étage
                    { path: 'administrativeUnit', select: '_id name' }
                ]
            }
        })
        .populate('agent', '_id firstName lastName')
        .then(record => {
            if (!record) return res.status(404).json({ message: 'Dossier introuvable' });
            res.status(200).json(record);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getByQrCode ──────────────────────────────────────────────────────────────

/**
 * Retrouve un dossier par son QR code — point d'entrée physique-numérique.
 *
 * Cet endpoint est le cœur du lien physique-numérique : en scannant le QR code
 * imprimé sur le dossier cartonné, l'application redirige vers cette route pour
 * afficher instantanément la fiche numérique complète du dossier avec toute
 * sa localisation hiérarchique.
 *
 * Le populate est identique à getOne (chaîne hiérarchique complète) car
 * l'utilisateur a besoin de toutes les informations de localisation.
 *
 * @param {import('express').Request}  req               - Requête HTTP
 * @param {string}                     req.params.qrCode - UUID du QR code (ex: "550e8400-e29b-41d4-a716-446655440000")
 * @param {import('express').Response} res               - Réponse HTTP
 *
 * @returns {200} Objet JSON du dossier avec hiérarchie complète peuplée
 * @returns {404} Aucun dossier ne correspond à ce QR code
 * @returns {500} Erreur serveur interne
 */
exports.getByQrCode = (req, res) => {
    Record.findOne({ qrCode: req.params.qrCode })
        .populate({
            path: 'binder',
            select: '_id name nature maxCapacity floor',
            populate: {
                path: 'floor',
                select: '_id number label shelf administrativeUnit',
                populate: [
                    {
                        path: 'shelf',
                        select: '_id name container',
                        populate: { path: 'container', select: '_id name location' }
                    },
                    { path: 'administrativeUnit', select: '_id name' }
                ]
            }
        })
        .populate('agent', '_id firstName lastName')
        .then(record => {
            if (!record) return res.status(404).json({ message: 'Dossier introuvable' });
            res.status(200).json(record);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── create ───────────────────────────────────────────────────────────────────

/**
 * Crée un nouveau dossier avec validation métier complète.
 *
 * Étapes exécutées dans l'ordre :
 *   1. Récupération du classeur cible → HTTP 404 si introuvable
 *   2. Vérification de la nature      → HTTP 422 si incompatible
 *   3. Vérification de la capacité    → HTTP 422 si classeur plein
 *   4. Génération automatique du QR code (UUID v4 via crypto.randomUUID)
 *   5. Injection de l'agent (res.locals.userId — utilisateur authentifié)
 *   6. Sauvegarde en base
 *
 * Le champ `qrCode` n'est jamais fourni par le client : il est toujours
 * généré côté serveur pour garantir l'unicité et l'intégrité.
 *
 * @param {import('express').Request}  req                        - Requête HTTP
 * @param {string}                     req.body.internalNumber    - Numéro interne (obligatoire, unique)
 * @param {string}                     req.body.refNumber         - Numéro de référence externe (obligatoire)
 * @param {string|Date}                req.body.editionDate       - Date d'édition du document (obligatoire)
 * @param {string|Date}                req.body.archivingDate     - Date d'archivage physique (obligatoire)
 * @param {string}                     req.body.subject           - Objet/sujet principal (obligatoire)
 * @param {string}                     req.body.category          - Catégorie du dossier (obligatoire)
 * @param {string}                     req.body.nature            - Nature (obligatoire — doit = classeur.nature)
 * @param {string}                     req.body.binder            - _id du classeur cible (obligatoire)
 * @param {object}                     [req.body.metadata]        - Métadonnées libres JSON
 * @param {import('express').Response} res                        - Réponse HTTP
 * @param {string}                     res.locals.userId          - _id de l'utilisateur connecté (injecté par auth)
 *
 * @returns {201} Objet JSON du dossier créé (avec qrCode généré)
 * @returns {404} Classeur cible introuvable
 * @returns {422} Nature incompatible OU classeur déjà plein
 * @returns {400} Autres erreurs de validation du modèle
 */
exports.create = async (req, res) => {
    try {
        // Étape 1 — Vérification de l'existence du classeur cible
        const binder = await Binder.findById(req.body.binder);
        if (!binder) {
            return res.status(404).json({ message: 'Classeur introuvable' });
        }

        // Étape 2 — Nature du dossier : auto-déduite du classeur si non fournie
        const recordNature = req.body.nature
            ? req.body.nature.toUpperCase()
            : binder.nature;
        if (recordNature !== binder.nature) {
            return res.status(422).json({
                message: `La nature du dossier ne correspond pas à celle du classeur (${binder.nature})`
            });
        }

        // Étape 3 — Règle métier : le classeur ne doit pas être plein
        const currentCount = await Record.countDocuments({ binder: binder._id });
        if (currentCount >= binder.maxCapacity) {
            return res.status(422).json({
                message: `Le classeur est plein (capacité maximale : ${binder.maxCapacity})`
            });
        }

        // Étape 4 & 5 — Création avec QR code généré automatiquement et agent injecté
        const record = new Record({
            internalNumber: req.body.internalNumber,
            refNumber:      req.body.refNumber,
            editionDate:    req.body.editionDate,
            archivingDate:  req.body.archivingDate,
            subject:        req.body.subject,
            category:       req.body.category,
            nature:         recordNature,
            binder:         req.body.binder,
            agent:          res.locals.userId,   // utilisateur connecté, jamais fourni par le client
            qrCode:         randomUUID(),         // UUID v4 unique, jamais fourni par le client
            metadata:       req.body.metadata
        });

        // Étape 6 — Sauvegarde
        const saved = await record.save();
        res.status(201).json(saved);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

// ─── update ───────────────────────────────────────────────────────────────────

/**
 * Met à jour un dossier existant avec re-validation si nécessaire.
 *
 * Si le corps de la requête contient `binder` ou `nature`, les deux règles
 * métier sont réévaluées pour le nouveau contexte :
 *   - Règle de nature  : nouvelle nature doit correspondre au classeur cible
 *   - Règle de capacité : si le classeur change, vérifier qu'il a de la place
 *
 * Si ni `binder` ni `nature` ne changent, la mise à jour est appliquée
 * directement sans re-validation (optimisation des requêtes).
 *
 * Note : le champ `qrCode` ne peut pas être modifié une fois généré.
 * Inclure `qrCode` dans le body sera ignoré ou rejeté par l'unicité.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du dossier à modifier
 * @param {object}                     req.body      - Champs à mettre à jour
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON du dossier mis à jour
 * @returns {404} Dossier ou classeur introuvable
 * @returns {422} Nature incompatible OU classeur de destination plein
 * @returns {400} Autres erreurs de validation
 */
exports.update = async (req, res) => {
    try {
        // Re-validation uniquement si binder ou nature sont modifiés
        if (req.body.binder || req.body.nature) {
            const existing = await Record.findById(req.params.id);
            if (!existing) return res.status(404).json({ message: 'Dossier introuvable' });

            // Utilise les nouvelles valeurs si fournies, sinon conserve les valeurs actuelles
            const binderId = req.body.binder || existing.binder;
            const nature   = req.body.nature ? req.body.nature.toUpperCase() : existing.nature;

            const binder = await Binder.findById(binderId);
            if (!binder) return res.status(404).json({ message: 'Classeur introuvable' });

            // Vérification de la compatibilité de nature avec le classeur cible
            if (nature !== binder.nature) {
                return res.status(422).json({
                    message: `La nature du dossier ('${nature}') ne correspond pas à celle du classeur ('${binder.nature}')`
                });
            }

            // Vérification de la capacité uniquement si le classeur change
            // (si le dossier reste dans le même classeur, il est déjà compté)
            if (req.body.binder && String(req.body.binder) !== String(existing.binder)) {
                const count = await Record.countDocuments({ binder: binderId });
                if (count >= binder.maxCapacity) {
                    return res.status(422).json({
                        message: `Le classeur de destination est plein (capacité maximale : ${binder.maxCapacity})`
                    });
                }
            }
        }

        // Application de la mise à jour avec re-validation des contraintes du schéma
        const updated = await Record.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Dossier introuvable' });
        res.status(200).json(updated);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

// ─── delete ───────────────────────────────────────────────────────────────────

/**
 * Supprime un dossier par son identifiant.
 *
 * La suppression d'un dossier n'a pas d'impact sur les archives numériques
 * qui lui sont associées via le champ `record` du modèle Archive : ces
 * archives conservent leur référence (désormais orpheline). À gérer selon
 * la politique de l'application (nullification, cascade, etc.).
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du dossier
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Message de confirmation de suppression
 * @returns {404} Dossier introuvable
 * @returns {500} Erreur serveur interne
 */
exports.delete = async (req, res) => {
    try {
        // Bloquer la suppression si des documents existent dans ce dossier
        const docCount = await Document.countDocuments({ record: req.params.id });
        if (docCount > 0) {
            return res.status(409).json({
                message: `Impossible de supprimer : ce dossier contient ${docCount} document(s)`
            });
        }

        const deleted = await Record.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Dossier introuvable' });
        res.status(200).json({ message: 'Dossier supprimé' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};
