/**
 * routes/admin.js — Routes d'administration
 *
 * Montées sur /admin dans app.js, protégées par deux middlewares :
 *   1. auth      → vérifie le token JWT
 *   2. adminAuth → vérifie que l'utilisateur a le rôle admin
 *
 * Endpoints disponibles :
 *   GET    /admin/users                   → liste tous les utilisateurs
 *   GET    /admin/users/:datas            → recherche d'utilisateurs par propriété
 *   POST   /admin/users                   → créer un utilisateur
 *   PUT    /admin/users                   → modifier un utilisateur
 *   PUT    /admin/users/permissions       → remplacer les permissions d'un utilisateur
 *   PUT    /admin/users/permissions/:mode → ajouter ou retirer une permission
 *   GET    /admin/roles                   → liste tous les rôles
 *   POST   /admin/roles                   → créer un rôle
 *   GET    /admin/:userId                 → récupérer un utilisateur par son ID
 */

const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/admin");

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

router.get("/users", adminCtrl.getAllUsers);
router.get("/users/:datas", adminCtrl.getUsersByProps);
router.post("/users", adminCtrl.AddOneUser);
router.put("/users", adminCtrl.modifyUser);
router.put("/users/permissions", adminCtrl.modifyUserPermission);
router.put("/users/permissions/:mode", adminCtrl.addOrRemoveUserPermission);

// ─── Rôles ────────────────────────────────────────────────────────────────────

router.get("/roles", adminCtrl.getAllRoles);
router.post("/roles", adminCtrl.addOneRole);

// ─── Utilisateur par ID (placé en dernier pour éviter les conflits de route) ──

router.get("/:userId", adminCtrl.getOneUser);

module.exports = router;
