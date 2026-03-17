'use strict';

/**
 * controllers/archives/physical/container.js
 *
 * Contrôleur CRUD — Conteneur
 *
 * Gère les opérations de création, lecture, modification et suppression
 * des conteneurs, qui constituent le niveau racine de la hiérarchie
 * physique d'archivage.
 *
 * ─── Hiérarchie rappel ───────────────────────────────────────────────────────
 *   [Conteneur] → Étagère → Étage → Classeur → Dossier → Archive
 *
 * ─── Routes associées (physical.routes.js) ───────────────────────────────────
 *   GET    /api/stuff/archives/physical/containers          → getAll
 *   GET    /api/stuff/archives/physical/containers/:id      → getOne
 *   POST   /api/stuff/archives/physical/containers          → create
 *   PUT    /api/stuff/archives/physical/containers/:id      → update
 *   DELETE /api/stuff/archives/physical/containers/:id      → delete
 */

const Container = require('../../../models/archives/container.model');

// ─── getAll ───────────────────────────────────────────────────────────────────

/**
 * Récupère la liste complète des conteneurs.
 *
 * Aucun filtre appliqué : retourne tous les documents de la collection.
 * Utilisé pour alimenter les sélecteurs dans l'interface de création
 * d'étagères ou pour afficher la vue d'ensemble de l'organisation physique.
 *
 * @param {import('express').Request}  _req - Requête HTTP (non utilisée)
 * @param {import('express').Response} res  - Réponse HTTP
 *
 * @returns {200} Tableau JSON de tous les conteneurs
 * @returns {500} Erreur serveur interne
 */
exports.getAll = (_req, res) => {
    Container.find()
        .then(containers => res.status(200).json(containers))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getOne ───────────────────────────────────────────────────────────────────

/**
 * Récupère un conteneur unique par son identifiant MongoDB (_id).
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du conteneur
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON du conteneur trouvé
 * @returns {404} Conteneur introuvable (id inexistant)
 * @returns {500} Erreur serveur interne
 */
exports.getOne = (req, res) => {
    Container.findById(req.params.id)
        .then(container => {
            if (!container) return res.status(404).json({ message: 'Conteneur introuvable' });
            res.status(200).json(container);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── create ───────────────────────────────────────────────────────────────────

/**
 * Crée un nouveau conteneur.
 *
 * Le champ `name` est obligatoire et sera automatiquement converti en
 * majuscules par le setter défini dans le modèle (ex : "armoire-a" → "ARMOIRE-A").
 * Si un conteneur portant le même nom existe déjà, mongoose-unique-validator
 * retourne une erreur 400 avec un message explicite.
 *
 * @param {import('express').Request}  req              - Requête HTTP
 * @param {string}                     req.body.name        - Nom du conteneur (obligatoire)
 * @param {string}                     [req.body.description] - Description libre
 * @param {string}                     [req.body.location]    - Localisation physique
 * @param {import('express').Response} res              - Réponse HTTP
 *
 * @returns {201} Objet JSON du conteneur créé
 * @returns {400} Données invalides ou nom déjà existant
 */
exports.create = (req, res) => {
    const container = new Container({
        name:        req.body.name,
        description: req.body.description,
        location:    req.body.location
    });
    container.save()
        .then(saved => res.status(201).json(saved))
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── update ───────────────────────────────────────────────────────────────────

/**
 * Met à jour un conteneur existant (mise à jour partielle possible).
 *
 * `runValidators: true` garantit que les règles du schéma (unicité, types)
 * sont réévaluées même lors d'une mise à jour.
 * `new: true` retourne le document mis à jour plutôt que l'ancien.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du conteneur
 * @param {object}                     req.body      - Champs à mettre à jour
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON du conteneur mis à jour
 * @returns {400} Données invalides
 * @returns {404} Conteneur introuvable
 */
exports.update = (req, res) => {
    Container.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .then(updated => {
            if (!updated) return res.status(404).json({ message: 'Conteneur introuvable' });
            res.status(200).json(updated);
        })
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── delete ───────────────────────────────────────────────────────────────────

/**
 * Supprime un conteneur par son identifiant.
 *
 * ATTENTION : cette opération ne vérifie pas si des étagères sont rattachées
 * à ce conteneur. Il est conseillé de s'assurer côté client (ou via un
 * middleware dédié) que le conteneur est vide avant toute suppression, afin
 * de ne pas laisser des étagères orphelines dans la base.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du conteneur
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Message de confirmation de suppression
 * @returns {404} Conteneur introuvable
 * @returns {500} Erreur serveur interne
 */
exports.delete = (req, res) => {
    Container.findByIdAndDelete(req.params.id)
        .then(deleted => {
            if (!deleted) return res.status(404).json({ message: 'Conteneur introuvable' });
            res.status(200).json({ message: 'Conteneur supprimé' });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
