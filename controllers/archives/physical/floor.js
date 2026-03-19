'use strict';

/**
 * controllers/archives/physical/floor.js
 *
 * Contrôleur CRUD — Étage
 *
 * Gère les opérations sur les étages, qui constituent le pont entre la
 * localisation physique (étagère/conteneur) et l'organisation administrative
 * (unité administrative / rôle).
 *
 * ─── Hiérarchie rappel ───────────────────────────────────────────────────────
 *   Conteneur → Étagère → [Étage] → Classeur → Dossier → Archive
 *
 * ─── Routes associées (physical.routes.js) ───────────────────────────────────
 *   GET    /api/stuff/archives/physical/floors                    → getAll
 *   GET    /api/stuff/archives/physical/floors/shelf/:shelfId     → getAllByShelf
 *   GET    /api/stuff/archives/physical/floors/:id                → getOne
 *   POST   /api/stuff/archives/physical/floors                    → create
 *   PUT    /api/stuff/archives/physical/floors/:id                → update
 *   DELETE /api/stuff/archives/physical/floors/:id                → delete
 *
 * ─── Double rattachement ────────────────────────────────────────────────────
 *   Chaque lecture peuple simultanément :
 *     - `shelf`              → localisation physique (étagère parente)
 *     - `administrativeUnit` → propriétaire organisationnel (rôle/direction)
 */

const Floor  = require('../../../models/archives/floor.model');
const Binder = require('../../../models/archives/binder.model');

// ─── getAll ───────────────────────────────────────────────────────────────────

/**
 * Récupère tous les étages, toutes étagères confondues.
 *
 * Peuple automatiquement `shelf` (_id, name) et `administrativeUnit` (_id, name)
 * pour éviter des requêtes supplémentaires côté client.
 *
 * @param {import('express').Request}  _req - Requête HTTP (non utilisée)
 * @param {import('express').Response} res  - Réponse HTTP
 *
 * @returns {200} Tableau JSON de tous les étages
 * @returns {500} Erreur serveur interne
 */
exports.getAll = (_req, res) => {
    Floor.find()
        .populate('shelf', '_id name')
        .populate('administrativeUnit', '_id name')
        .then(floors => res.status(200).json(floors))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getAllByShelf ─────────────────────────────────────────────────────────────

/**
 * Récupère tous les étages appartenant à une étagère spécifique.
 *
 * Utile pour afficher les niveaux d'une étagère dans la vue de navigation
 * hiérarchique, ainsi que les unités administratives associées à chaque niveau.
 *
 * @param {import('express').Request}  req                 - Requête HTTP
 * @param {string}                     req.params.shelfId  - _id MongoDB de l'étagère parente
 * @param {import('express').Response} res                 - Réponse HTTP
 *
 * @returns {200} Tableau JSON des étages de l'étagère
 * @returns {500} Erreur serveur interne
 */
exports.getAllByShelf = (req, res) => {
    Floor.find({ shelf: req.params.shelfId })
        .populate('shelf', '_id name')
        .populate('administrativeUnit', '_id name')
        .then(floors => res.status(200).json(floors))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getOne ───────────────────────────────────────────────────────────────────

/**
 * Récupère un étage unique par son identifiant MongoDB (_id).
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB de l'étage
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON de l'étage (avec shelf et administrativeUnit peuplés)
 * @returns {404} Étage introuvable
 * @returns {500} Erreur serveur interne
 */
exports.getOne = (req, res) => {
    Floor.findById(req.params.id)
        .populate('shelf', '_id name')
        .populate('administrativeUnit', '_id name')
        .then(floor => {
            if (!floor) return res.status(404).json({ message: 'Étage introuvable' });
            res.status(200).json(floor);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── create ───────────────────────────────────────────────────────────────────

/**
 * Crée un nouvel étage rattaché à une étagère et à une unité administrative.
 *
 * Les champs `shelf` et `administrativeUnit` doivent être des _id MongoDB
 * valides (vérifiés par le validateur du modèle). Le champ `number` représente
 * l'ordre physique de l'étage dans l'étagère (1, 2, 3…).
 *
 * @param {import('express').Request}  req                          - Requête HTTP
 * @param {number}                     req.body.number              - Numéro de l'étage (obligatoire)
 * @param {string}                     [req.body.label]             - Libellé descriptif
 * @param {string}                     req.body.shelf               - _id de l'étagère parente (obligatoire)
 * @param {string}                     req.body.administrativeUnit  - _id du rôle/unité (obligatoire)
 * @param {import('express').Response} res                          - Réponse HTTP
 *
 * @returns {201} Objet JSON de l'étage créé
 * @returns {400} Données invalides (champ manquant ou _id invalide)
 */
exports.create = (req, res) => {
    const floor = new Floor({
        number:             req.body.number,
        label:              req.body.label,
        shelf:              req.body.shelf,
        administrativeUnit: req.body.administrativeUnit
    });
    floor.save()
        .then(saved => res.status(201).json(saved))
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── update ───────────────────────────────────────────────────────────────────

/**
 * Met à jour un étage existant (mise à jour partielle possible).
 *
 * `runValidators: true` garantit que les validateurs ObjectId sur `shelf`
 * et `administrativeUnit` sont réévalués lors de la mise à jour.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB de l'étage
 * @param {object}                     req.body      - Champs à mettre à jour
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON de l'étage mis à jour
 * @returns {400} Données invalides
 * @returns {404} Étage introuvable
 */
exports.update = (req, res) => {
    Floor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .then(updated => {
            if (!updated) return res.status(404).json({ message: 'Étage introuvable' });
            res.status(200).json(updated);
        })
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── delete ───────────────────────────────────────────────────────────────────

/**
 * Supprime un étage par son identifiant.
 *
 * ATTENTION : cette opération ne vérifie pas si des classeurs sont rattachés
 * à cet étage. S'assurer que l'étage est vide avant de procéder.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB de l'étage
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Message de confirmation
 * @returns {404} Étage introuvable
 * @returns {500} Erreur serveur interne
 */
exports.delete = async (req, res) => {
    try {
        const hasChildren = await Binder.exists({ floor: req.params.id });
        if (hasChildren) {
            return res.status(409).json({
                error: 'Cet étage contient des classeurs. Supprimez-les avant de supprimer l\'étage.'
            });
        }
        const deleted = await Floor.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Étage introuvable' });
        res.status(200).json({ message: 'Étage supprimé' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};
