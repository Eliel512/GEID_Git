'use strict';

/**
 * controllers/archives/physical/shelf.js
 *
 * Contrôleur CRUD — Étagère
 *
 * Gère les opérations sur les étagères, qui sont les enfants directs
 * des conteneurs dans la hiérarchie physique d'archivage.
 *
 * ─── Hiérarchie rappel ───────────────────────────────────────────────────────
 *   Conteneur → [Étagère] → Étage → Classeur → Dossier → Archive
 *
 * ─── Routes associées (physical.routes.js) ───────────────────────────────────
 *   GET    /api/stuff/archives/physical/shelves                          → getAll
 *   GET    /api/stuff/archives/physical/shelves/container/:containerId   → getAllByContainer
 *   GET    /api/stuff/archives/physical/shelves/:id                      → getOne
 *   POST   /api/stuff/archives/physical/shelves                          → create
 *   PUT    /api/stuff/archives/physical/shelves/:id                      → update
 *   DELETE /api/stuff/archives/physical/shelves/:id                      → delete
 *
 * ─── Populate systématique ───────────────────────────────────────────────────
 *   Toutes les lectures peuplent le champ `container` pour exposer le nom
 *   et la localisation du conteneur parent sans requête supplémentaire côté client.
 */

const Shelf = require('../../../models/archives/shelf.model');
const Floor = require('../../../models/archives/floor.model');

// ─── getAll ───────────────────────────────────────────────────────────────────

/**
 * Récupère toutes les étagères, toutes origines confondues.
 *
 * Le champ `container` est peuplé automatiquement avec les champs
 * `_id`, `name` et `location` du conteneur parent.
 *
 * @param {import('express').Request}  _req - Requête HTTP (non utilisée)
 * @param {import('express').Response} res  - Réponse HTTP
 *
 * @returns {200} Tableau JSON de toutes les étagères (avec conteneur peuplé)
 * @returns {500} Erreur serveur interne
 */
exports.getAll = (_req, res) => {
    Shelf.find()
        .populate('container', '_id name location')
        .then(shelves => res.status(200).json(shelves))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getAllByContainer ────────────────────────────────────────────────────────

/**
 * Récupère toutes les étagères appartenant à un conteneur spécifique.
 *
 * Utile pour construire la vue détaillée d'un conteneur et lister
 * ses enfants directs dans l'interface de navigation hiérarchique.
 *
 * @param {import('express').Request}  req                    - Requête HTTP
 * @param {string}                     req.params.containerId - _id MongoDB du conteneur parent
 * @param {import('express').Response} res                    - Réponse HTTP
 *
 * @returns {200} Tableau JSON des étagères du conteneur (avec conteneur peuplé)
 * @returns {500} Erreur serveur interne
 */
exports.getAllByContainer = (req, res) => {
    Shelf.find({ container: req.params.containerId })
        .populate('container', '_id name location')
        .then(shelves => res.status(200).json(shelves))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getOne ───────────────────────────────────────────────────────────────────

/**
 * Récupère une étagère unique par son identifiant MongoDB (_id).
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB de l'étagère
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON de l'étagère (avec conteneur peuplé)
 * @returns {404} Étagère introuvable
 * @returns {500} Erreur serveur interne
 */
exports.getOne = (req, res) => {
    Shelf.findById(req.params.id)
        .populate('container', '_id name location')
        .then(shelf => {
            if (!shelf) return res.status(404).json({ message: 'Étagère introuvable' });
            res.status(200).json(shelf);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── create ───────────────────────────────────────────────────────────────────

/**
 * Crée une nouvelle étagère rattachée à un conteneur existant.
 *
 * Le champ `name` est automatiquement converti en majuscules par le setter
 * du modèle. Le champ `container` doit être un _id valide d'un conteneur
 * existant (validé au niveau du modèle par isValidObjectId).
 *
 * @param {import('express').Request}  req                  - Requête HTTP
 * @param {string}                     req.body.name        - Nom de l'étagère (obligatoire)
 * @param {string}                     req.body.container   - _id du conteneur parent (obligatoire)
 * @param {string}                     [req.body.description] - Description libre
 * @param {import('express').Response} res                  - Réponse HTTP
 *
 * @returns {201} Objet JSON de l'étagère créée
 * @returns {400} Données invalides (champ manquant ou _id de conteneur invalide)
 */
exports.create = (req, res) => {
    const shelf = new Shelf({
        name:        req.body.name,
        container:   req.body.container,
        description: req.body.description
    });
    shelf.save()
        .then(saved => res.status(201).json(saved))
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── update ───────────────────────────────────────────────────────────────────

/**
 * Met à jour une étagère existante (mise à jour partielle possible).
 *
 * `runValidators: true` garantit que les règles du schéma (validateur ObjectId
 * sur `container`) sont réévaluées lors de la mise à jour.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB de l'étagère
 * @param {object}                     req.body      - Champs à mettre à jour
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON de l'étagère mise à jour
 * @returns {400} Données invalides
 * @returns {404} Étagère introuvable
 */
exports.update = (req, res) => {
    Shelf.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .then(updated => {
            if (!updated) return res.status(404).json({ message: 'Étagère introuvable' });
            res.status(200).json(updated);
        })
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── delete ───────────────────────────────────────────────────────────────────

/**
 * Supprime une étagère par son identifiant.
 *
 * ATTENTION : cette opération ne vérifie pas si des étages sont rattachés
 * à cette étagère. Il est conseillé de s'assurer que l'étagère est vide
 * (aucun étage enfant) avant de procéder à la suppression.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB de l'étagère
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Message de confirmation
 * @returns {404} Étagère introuvable
 * @returns {500} Erreur serveur interne
 */
exports.delete = async (req, res) => {
    try {
        const hasChildren = await Floor.exists({ shelf: req.params.id });
        if (hasChildren) {
            return res.status(409).json({
                error: 'Cette étagère contient des étages. Supprimez-les avant de supprimer l\'étagère.'
            });
        }
        const deleted = await Shelf.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Étagère introuvable' });
        res.status(200).json({ message: 'Étagère supprimée' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};
