'use strict';

/**
 * controllers/archives/physical/binder.js
 *
 * Contrôleur CRUD — Classeur
 *
 * Gère les opérations sur les classeurs, conteneurs directs des dossiers
 * physiques. Le classeur est l'entité régulatrice du flux d'archivage :
 * il impose une nature unique et une capacité maximale à respecter.
 *
 * ─── Hiérarchie rappel ───────────────────────────────────────────────────────
 *   Conteneur → Étagère → Étage → [Classeur] → Dossier → Archive
 *
 * ─── Routes associées (physical.routes.js) ───────────────────────────────────
 *   GET    /api/stuff/archives/physical/binders                  → getAll
 *   GET    /api/stuff/archives/physical/binders/floor/:floorId   → getAllByFloor
 *   GET    /api/stuff/archives/physical/binders/:id              → getOne
 *   POST   /api/stuff/archives/physical/binders                  → create
 *   PUT    /api/stuff/archives/physical/binders/:id              → update
 *   DELETE /api/stuff/archives/physical/binders/:id              → delete
 *
 * ─── Règles métier portées par ce contrôleur ─────────────────────────────────
 *   1. SUPPRESSION PROTÉGÉE : un classeur ne peut pas être supprimé s'il
 *      contient encore des dossiers (Record.exists → HTTP 409).
 *   2. TAUX DE REMPLISSAGE : getOne calcule dynamiquement le nombre de dossiers
 *      présents (`currentCount`) et le renvoie avec les données du classeur.
 *      Les règles de validation de nature et de capacité lors de l'ajout d'un
 *      dossier sont gérées dans record.js (contrôleur des dossiers).
 */

const Binder = require('../../../models/archives/binder.model');
const Record = require('../../../models/archives/record.model');

// ─── getAll ───────────────────────────────────────────────────────────────────

/**
 * Récupère tous les classeurs, tous étages confondus.
 *
 * Peuple le champ `floor` avec les informations de base de l'étage parent
 * (_id, number, label) pour permettre la navigation hiérarchique.
 *
 * @param {import('express').Request}  _req - Requête HTTP (non utilisée)
 * @param {import('express').Response} res  - Réponse HTTP
 *
 * @returns {200} Tableau JSON de tous les classeurs
 * @returns {500} Erreur serveur interne
 */
exports.getAll = async (_req, res) => {
    try {
        const binders = await Binder.find().populate('floor', '_id number label');
        // Calcul du currentCount pour chaque classeur (identique à getOne)
        const withCount = await Promise.all(
            binders.map(async (binder) => {
                const currentCount = await Record.countDocuments({ binder: binder._id });
                return { ...binder.toObject(), currentCount };
            })
        );
        res.status(200).json(withCount);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};

// ─── getAllByFloor ─────────────────────────────────────────────────────────────

/**
 * Récupère tous les classeurs d'un étage spécifique.
 *
 * Utile pour afficher l'ensemble des classeurs disponibles sur un étage donné,
 * notamment pour guider l'utilisateur lors de l'affectation d'un nouveau dossier.
 *
 * @param {import('express').Request}  req               - Requête HTTP
 * @param {string}                     req.params.floorId - _id MongoDB de l'étage parent
 * @param {import('express').Response} res               - Réponse HTTP
 *
 * @returns {200} Tableau JSON des classeurs de l'étage
 * @returns {500} Erreur serveur interne
 */
exports.getAllByFloor = (req, res) => {
    Binder.find({ floor: req.params.floorId })
        .populate('floor', '_id number label')
        .then(binders => res.status(200).json(binders))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── getOne ───────────────────────────────────────────────────────────────────

/**
 * Récupère un classeur unique avec son taux de remplissage calculé.
 *
 * En plus des données du classeur, cette fonction calcule dynamiquement
 * le nombre de dossiers actuellement présents (`currentCount`) via
 * `Record.countDocuments`. Ce chiffre permet à l'interface d'afficher
 * une jauge de remplissage (currentCount / maxCapacity).
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du classeur
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON du classeur + champ `currentCount` calculé
 * @returns {404} Classeur introuvable
 * @returns {500} Erreur serveur interne
 */
exports.getOne = (req, res) => {
    Binder.findById(req.params.id)
        .populate('floor', '_id number label shelf administrativeUnit')
        .then(async binder => {
            if (!binder) return res.status(404).json({ message: 'Classeur introuvable' });
            // Calcul dynamique du nombre de dossiers présents dans ce classeur
            const currentCount = await Record.countDocuments({ binder: binder._id });
            res.status(200).json({ ...binder.toObject(), currentCount });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};

// ─── create ───────────────────────────────────────────────────────────────────

/**
 * Crée un nouveau classeur rattaché à un étage.
 *
 * Les champs `nature` et `name` sont automatiquement convertis en majuscules
 * par les setters du modèle.
 * La valeur de `maxCapacity` (minimum 1) définit le plafond d'accueil :
 * toute tentative d'ajout de dossier au-delà sera refusée par record.js.
 *
 * @param {import('express').Request}  req                  - Requête HTTP
 * @param {string}                     req.body.name        - Nom du classeur (obligatoire)
 * @param {string}                     req.body.floor       - _id de l'étage parent (obligatoire)
 * @param {string}                     req.body.nature      - Nature des dossiers acceptés (obligatoire)
 * @param {number}                     req.body.maxCapacity - Capacité maximale en dossiers (obligatoire, min 1)
 * @param {import('express').Response} res                  - Réponse HTTP
 *
 * @returns {201} Objet JSON du classeur créé
 * @returns {400} Données invalides (champ manquant, capacité < 1, _id invalide)
 */
exports.create = (req, res) => {
    const binder = new Binder({
        name:        req.body.name,
        floor:       req.body.floor,
        nature:      req.body.nature,
        maxCapacity: req.body.maxCapacity
    });
    binder.save()
        .then(saved => res.status(201).json(saved))
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── update ───────────────────────────────────────────────────────────────────

/**
 * Met à jour un classeur existant (mise à jour partielle possible).
 *
 * ATTENTION : modifier la `nature` d'un classeur après qu'il contient déjà
 * des dossiers peut créer une incohérence (dossiers de nature différente).
 * Cette vérification n'est pas effectuée ici ; à prendre en charge côté client
 * ou via un middleware dédié si nécessaire.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du classeur
 * @param {object}                     req.body      - Champs à mettre à jour
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Objet JSON du classeur mis à jour
 * @returns {400} Données invalides
 * @returns {404} Classeur introuvable
 */
exports.update = (req, res) => {
    Binder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .then(updated => {
            if (!updated) return res.status(404).json({ message: 'Classeur introuvable' });
            res.status(200).json(updated);
        })
        .catch(error => {
            console.log(error);
            res.status(400).json({ message: error.message });
        });
};

// ─── delete ───────────────────────────────────────────────────────────────────

/**
 * Supprime un classeur uniquement s'il ne contient aucun dossier.
 *
 * Avant la suppression physique, on vérifie l'existence d'au moins un dossier
 * (Record) référençant ce classeur. Si c'est le cas, la suppression est refusée
 * avec un HTTP 409 (Conflict) pour préserver l'intégrité référentielle.
 * Cette politique protège les dossiers d'une suppression accidentelle de leur
 * classeur parent.
 *
 * @param {import('express').Request}  req        - Requête HTTP
 * @param {string}                     req.params.id - _id MongoDB du classeur
 * @param {import('express').Response} res        - Réponse HTTP
 *
 * @returns {200} Message de confirmation de suppression
 * @returns {404} Classeur introuvable
 * @returns {409} Suppression refusée — le classeur contient encore des dossiers
 * @returns {500} Erreur serveur interne
 */
exports.delete = async (req, res) => {
    try {
        // Vérification de l'intégrité : refus si au moins un dossier est présent
        const exists = await Record.exists({ binder: req.params.id });
        if (exists) {
            return res.status(409).json({
                message: 'Impossible de supprimer ce classeur : il contient des dossiers'
            });
        }
        const deleted = await Binder.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Classeur introuvable' });
        res.status(200).json({ message: 'Classeur supprimé' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};
