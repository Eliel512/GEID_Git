/**
 * _seed-test.js — Crée un utilisateur archiviste de test avec accès complet aux archives.
 * Appelé par create-test-user.sh avec les arguments :
 *   --email=<email> --password=<pwd> --fname=<prenom> --lname=<nom> --phone=<tel>
 *
 * Ce script est idempotent : il met à jour les documents s'ils existent déjà.
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

const EMAIL    = args.email    || "archiviste@geid.local";
const PASSWORD = args.password || "Archiviste@1234";
const FNAME    = args.fname    || "Jean-Pierre";
const LNAME    = args.lname    || "MUKENDI";
const PHONE    = args.phone    || "+243821000001";
const ROLE     = args.role     || "archiviste-test";

// ── Permissions archives complètes ───────────────────────────────────────────

const ARCHIVES_PRIVILEGES = [
  { app: "archives", permissions: [{ struct: "all", access: "write" }] },
];

// ── Connexion MongoDB ─────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/geid";

async function run() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // ── 1. Auth archiviste ────────────────────────────────────────────────────

  const authName = `archives-test-${ROLE}`;
  let auth = await Auth.findOne({ name: authName });

  if (auth) {
    auth.privileges = ARCHIVES_PRIVILEGES;
    await auth.save();
    console.log(`  [Auth] Mis à jour  (id: ${auth._id})`);
  } else {
    auth = await Auth.create({
      name: authName,
      privileges: ARCHIVES_PRIVILEGES,
      upper: ["admin"],
    });
    console.log(`  [Auth] Créé        (id: ${auth._id})`);
  }

  // ── 2. Role de test ───────────────────────────────────────────────────────
  //    Le login controller cherche Role.findOne({ name: grade.role }) —
  //    sans ce document le login retournerait une erreur 500.

  const roleExists = await Role.findOne({ name: ROLE });
  if (!roleExists) {
    await Role.create({ name: ROLE, docTypes: [] });
    console.log(`  [Role] Créé        (name: ${ROLE})`);
  } else {
    console.log(`  [Role] Déjà présent (name: ${ROLE})`);
  }

  // ── 3. Hash du mot de passe ───────────────────────────────────────────────

  const hash = await bcrypt.hash(PASSWORD, 10);

  // ── 4. Utilisateur de test ────────────────────────────────────────────────

  const userData = {
    isValid:   true,
    fname:     FNAME,
    lname:     LNAME,
    email:     EMAIL,
    phoneCell: PHONE,
    password:  hash,
    grade: {
      grade: "Archiviste",
      role:  ROLE,
    },
    auth: auth._id.toString(),
  };

  const existing = await User.findOne({ email: EMAIL });

  if (existing) {
    Object.assign(existing, userData);
    await existing.save();
    console.log(`  [User] Mis à jour  (id: ${existing._id})`);
  } else {
    const roleConflict = await User.findOne({ "grade.role": ROLE });
    if (roleConflict) {
      console.warn(
        `  [User] ⚠  Le rôle "${ROLE}" est déjà attribué à ${roleConflict.email}.`
      );
      process.exitCode = 1;
      await mongoose.disconnect();
      return;
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
