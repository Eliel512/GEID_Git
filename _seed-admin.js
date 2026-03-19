/**
 * _seed-admin.js — Crée un utilisateur administrateur avec toutes les permissions.
 * Appelé par create-admin.sh avec les arguments :
 *   --email=<email> --password=<pwd> --fname=<prenom> --lname=<nom> --phone=<tel>
 *
 * Ce script est idempotent : il met à jour l'Auth et l'User s'ils existent déjà.
 */

"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./models/users/user.model");
const Auth     = require("./models/users/auth.model");
const Role     = require("./models/users/role.model");

// ── Lecture des arguments CLI (--key=value) ───────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith("--"))
    .map(a => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=")];
    })
);

const EMAIL    = args.email    || "admin@geid.local";
const PASSWORD = args.password || "Admin@1234";
const FNAME    = args.fname    || "Admin";
const LNAME    = args.lname    || "GEID";
const PHONE    = args.phone    || "+243810000000";

// ── Liste exhaustive des applications et permissions ──────────────────────────
// "struct": "all" + "access": "write" → accès total sur toutes les structures

const ALL_PRIVILEGES = [
  { app: "archives",      permissions: [{ struct: "all", access: "write" }] },
  { app: "workspace",     permissions: [{ struct: "all", access: "write" }] },
  { app: "library",       permissions: [{ struct: "all", access: "write" }] },
  { app: "image_library", permissions: [{ struct: "all", access: "write" }] },
  { app: "film_library",  permissions: [{ struct: "all", access: "write" }] },
];

// ── Connexion MongoDB ─────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/geid";

async function run() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // ── 1. Auth administrateur ────────────────────────────────────────────────
  //    Cherche un Auth nommé "admin", le crée ou le met à jour.

  let auth = await Auth.findOne({ name: "admin" });

  if (auth) {
    auth.privileges = ALL_PRIVILEGES;
    auth.upper = [];
    await auth.save();
    console.log(`  [Auth] Mis à jour  (id: ${auth._id})`);
  } else {
    auth = await Auth.create({
      name: "admin",
      privileges: ALL_PRIVILEGES,
      upper: [],
    });
    console.log(`  [Auth] Créé        (id: ${auth._id})`);
  }

  // ── 2. Role administrateur ────────────────────────────────────────────────
  //    Le login controller fait Role.findOne({ name: grade.role }) pour récupérer
  //    les docTypes — sans ce document le login planterait.

  const roleExists = await Role.findOne({ name: "admin" });
  if (!roleExists) {
    await Role.create({ name: "admin", docTypes: [] });
    console.log(`  [Role] Créé        (name: admin)`);
  } else {
    console.log(`  [Role] Déjà présent (name: admin)`);
  }

  // ── 4. Hash du mot de passe ───────────────────────────────────────────────

  const hash = await bcrypt.hash(PASSWORD, 10);

  // ── 5. Utilisateur administrateur ────────────────────────────────────────
  //    Cherche par email, crée ou met à jour.

  const userData = {
    isValid:   true,
    fname:     FNAME,
    lname:     LNAME,
    email:     EMAIL,
    phoneCell: PHONE,
    password:  hash,
    grade: {
      grade: "Administrateur",
      role:  "admin",
    },
    auth: auth._id.toString(),
  };

  const existing = await User.findOne({ email: EMAIL });

  if (existing) {
    // Met à jour sans toucher à _id ni joinedAt
    Object.assign(existing, userData);
    await existing.save();
    console.log(`  [User] Mis à jour  (id: ${existing._id})`);
  } else {
    // Vérifie qu'aucun autre user n'a le rôle "admin" (grade.role est unique)
    const roleConflict = await User.findOne({ "grade.role": "admin" });
    if (roleConflict) {
      console.warn(
        `  [User] ⚠  Un utilisateur avec le rôle "admin" existe déjà ` +
        `(${roleConflict.email}). Son rôle sera conservé.`
      );
      // Crée quand même l'utilisateur avec un rôle légèrement différent
      userData.grade.role = `admin_${Date.now()}`;
    }

    const user = await User.create(userData);
    console.log(`  [User] Créé        (id: ${user._id})`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(`\n  [ERREUR] ${err.message || err}\n`);
  process.exit(1);
});
