/**
 * _test-archives.js — Tests d'intégration complets du module Archives
 *
 * Couvre l'ensemble des routes :
 *   • Archives numériques  : archived, validate, invalid, events, postOne
 *   • Archives physiques   : containers, shelves, floors, binders, records
 *   • Règles métier        : nature incompatible (422), classeur plein (422),
 *                            suppression classeur non vide (409)
 *   • Sécurité             : accès sans token (401), token invalide (401)
 *
 * Stratégie : cycle CRUD complet (Create → Read → Update → Delete)
 * pour chaque entité physique, avec nettoyage automatique à la fin.
 *
 * Usage :
 *   node _test-archives.js [--host=localhost] [--port=3000]
 *   node _test-archives.js --email=archiviste@geid.local --password=Archiviste@1234
 */

"use strict";

const http = require("http");

// ── Arguments CLI ─────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith("--"))
    .map(a => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=")];
    })
);

const HOST     = args.host     || "localhost";
const PORT     = parseInt(args.port || "3000", 10);
const EMAIL    = args.email    || "archiviste@geid.local";
const PASSWORD = args.password || "Archiviste@1234";

const BASE_PHYSICAL = "/api/stuff/archives/physical";
const BASE_ARCHIVE  = "/api/stuff/archives";

// ── Couleurs terminal ─────────────────────────────────────────────────────────

const R = "\x1b[0m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

// ── Compteurs ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

// ── Utilitaires ───────────────────────────────────────────────────────────────

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token  ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const r = http.request(options, res => {
      let data = "";
      res.on("data", c => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on("error", reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function ok(label) {
  console.log(`  ${GREEN}✔${R}  ${label}`);
  passed++;
}

function fail(label, reason) {
  console.log(`  ${RED}✘${R}  ${label}`);
  console.log(`     ${YELLOW}↳ ${reason}${R}`);
  failed++;
  failures.push({ label, reason });
}

function section(title) {
  console.log(`\n${CYAN}${BOLD}── ${title} ${DIM}${"─".repeat(Math.max(0, 48 - title.length))}${R}`);
}

function check(label, res, expectedStatus, extraCheck) {
  if (res.status !== expectedStatus) {
    fail(label, `Attendu ${expectedStatus}, reçu ${res.status} — ${JSON.stringify(res.body).slice(0, 120)}`);
    return false;
  }
  if (extraCheck && !extraCheck(res.body)) {
    fail(label, `Statut ${res.status} OK mais contenu inattendu : ${JSON.stringify(res.body).slice(0, 120)}`);
    return false;
  }
  ok(label);
  return true;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${CYAN}${BOLD}╔══════════════════════════════════════════════════════╗${R}`);
  console.log(`${CYAN}${BOLD}║   GEID — Tests intégration complets module Archives  ║${R}`);
  console.log(`${CYAN}${BOLD}╚══════════════════════════════════════════════════════╝${R}`);
  console.log(`\n  ${DIM}Serveur : http://${HOST}:${PORT}${R}`);
  console.log(`  ${DIM}Compte  : ${EMAIL}${R}\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // 1. AUTHENTIFICATION
  // ════════════════════════════════════════════════════════════════════════════

  section("1. Authentification");

  // 1.a Login valide
  let loginRes;
  try {
    loginRes = await req("POST", "/api/auth/login", { email: EMAIL, password: PASSWORD });
  } catch (e) {
    fail("POST /api/auth/login", `Serveur inaccessible : ${e.message}`);
    summary(); return;
  }

  if (loginRes.status !== 200 || !loginRes.body.token) {
    fail("POST /api/auth/login", `${loginRes.status} — ${JSON.stringify(loginRes.body).slice(0,120)}\n     → Lancez d'abord : bash create-test-user.sh`);
    summary(); return;
  }
  ok("POST /api/auth/login → 200 + token JWT");

  const token = loginRes.body.token;
  // On récupère l'auth._id comme ObjectId valide pour les tests nécessitant un ref
  const adminUnitId = loginRes.body.auth?._id || loginRes.body.auth;

  // 1.b Mauvais mot de passe
  const badPwd = await req("POST", "/api/auth/login", { email: EMAIL, password: "MauvaisMotDePasse!" });
  check("POST /api/auth/login (mauvais mdp) → 400", badPwd, 400);

  // ════════════════════════════════════════════════════════════════════════════
  // 2. SÉCURITÉ — accès sans token / token invalide
  // ════════════════════════════════════════════════════════════════════════════

  section("2. Sécurité — accès non authentifié");

  const noToken = await req("GET", `${BASE_ARCHIVE}/archived`);
  check("GET /archives/archived sans token → 401", noToken, 401);

  const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NiJ9.invalide";
  const badToken = await req("GET", `${BASE_ARCHIVE}/archived`, null, fakeToken);
  check("GET /archives/archived avec token invalide → 401", badToken, 401);

  // ════════════════════════════════════════════════════════════════════════════
  // 3. ARCHIVES NUMÉRIQUES — lectures
  // ════════════════════════════════════════════════════════════════════════════

  section("3. Archives numériques — lectures");

  const archived = await req("GET", `${BASE_ARCHIVE}/archived`, null, token);
  check("GET /archives/archived → 200 tableau", archived, 200, b => Array.isArray(b));

  const validate = await req("GET", "/api/stuff/validate", null, token);
  check("GET /validate → 200 tableau", validate, 200, b => Array.isArray(b));

  const invalid = await req("GET", `${BASE_ARCHIVE}/invalid`, null, token);
  check("GET /archives/invalid → 200 tableau", invalid, 200, b => Array.isArray(b));

  const events = await req("GET", `${BASE_ARCHIVE}/event`, null, token);
  check("GET /archives/event → 200 tableau", events, 200, b => Array.isArray(b));

  // GET /archives/:role — paramètre JSON encodé (tableau vide attendu, rôle test inexistant en archive)
  const roleParam = encodeURIComponent(JSON.stringify({ role: "archiviste-test" }));
  const byRole = await req("GET", `${BASE_ARCHIVE}/${roleParam}`, null, token);
  check("GET /archives/:role (JSON) → 200 tableau", byRole, 200, b => Array.isArray(b));

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ÉVÉNEMENTS — cycle CRUD
  // ════════════════════════════════════════════════════════════════════════════

  section("4. Événements — CRUD");

  const uniqueEventName = `EVT-TEST-${Date.now()}`;
  let eventId = null;

  const createEvent = await req("POST", `${BASE_ARCHIVE}/event`, {
    name: uniqueEventName,
    description: "Événement créé automatiquement par les tests d'intégration GEID",
    endDate: new Date(Date.now() + 86400 * 1000).toISOString(),
    administrativeUnits: [adminUnitId]
  }, token);
  if (check("POST /archives/event → 200/201 liste d'événements", createEvent, 200, b => Array.isArray(b))) {
    const created = createEvent.body.find(e => e.name === uniqueEventName);
    if (created) {
      eventId = created._id;
      ok(`  → Événement créé (id: ${eventId})`);
    } else {
      fail("Récupération id de l'événement créé", "Non trouvé dans la liste retournée");
    }
  }

  // GET par rôle (getAllForOne — utilise res.locals.userId → grade.role)
  const evtByRole = await req("GET", `${BASE_ARCHIVE}/event/archiviste-test`, null, token);
  check("GET /archives/event/:role → 200 tableau", evtByRole, 200, b => Array.isArray(b));

  // DELETE
  if (eventId) {
    const delEvt = await req("DELETE", `${BASE_ARCHIVE}/event/${eventId}`, null, token);
    check("DELETE /archives/event/:id → 200", delEvt, 200);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. PHYSIQUE — Conteneurs (CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  section("5. Physique — Conteneurs CRUD");

  const containerName = `ARMOIRE-TEST-${Date.now()}`;
  let containerId = null;

  const listContainers = await req("GET", `${BASE_PHYSICAL}/containers`, null, token);
  check("GET /physical/containers → 200 tableau", listContainers, 200, b => Array.isArray(b));

  const createContainer = await req("POST", `${BASE_PHYSICAL}/containers`, {
    name: containerName,
    description: "Conteneur de test intégration",
    location: "Salle des tests, couloir principal"
  }, token);
  if (check("POST /physical/containers → 201", createContainer, 201, b => b._id && b.name === containerName.toUpperCase())) {
    containerId = createContainer.body._id;
  }

  if (containerId) {
    const getContainer = await req("GET", `${BASE_PHYSICAL}/containers/${containerId}`, null, token);
    check("GET /physical/containers/:id → 200", getContainer, 200, b => b._id === containerId);

    const updateContainer = await req("PUT", `${BASE_PHYSICAL}/containers/${containerId}`,
      { description: "Description mise à jour par les tests" }, token);
    check("PUT /physical/containers/:id → 200", updateContainer, 200,
      b => b.description === "Description mise à jour par les tests");

    const getUnknown = await req("GET", `${BASE_PHYSICAL}/containers/000000000000000000000000`, null, token);
    check("GET /physical/containers/id-inconnu → 404", getUnknown, 404);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. PHYSIQUE — Étagères (CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  section("6. Physique — Étagères CRUD");

  let shelfId = null;

  const listShelves = await req("GET", `${BASE_PHYSICAL}/shelves`, null, token);
  check("GET /physical/shelves → 200 tableau", listShelves, 200, b => Array.isArray(b));

  if (containerId) {
    const createShelf = await req("POST", `${BASE_PHYSICAL}/shelves`, {
      name: `ETAGERE-TEST-${Date.now()}`,
      container: containerId,
      description: "Étagère de test"
    }, token);
    if (check("POST /physical/shelves → 201", createShelf, 201, b => b._id && b.container === containerId)) {
      shelfId = createShelf.body._id;
    }

    if (shelfId) {
      const byContainer = await req("GET", `${BASE_PHYSICAL}/shelves/container/${containerId}`, null, token);
      check("GET /physical/shelves/container/:id → 200 tableau", byContainer, 200, b => Array.isArray(b));

      const getShelf = await req("GET", `${BASE_PHYSICAL}/shelves/${shelfId}`, null, token);
      check("GET /physical/shelves/:id → 200", getShelf, 200, b => b._id === shelfId);

      const updateShelf = await req("PUT", `${BASE_PHYSICAL}/shelves/${shelfId}`,
        { description: "Étagère mise à jour" }, token);
      check("PUT /physical/shelves/:id → 200", updateShelf, 200);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 7. PHYSIQUE — Étages (CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  section("7. Physique — Étages CRUD");

  let floorId = null;

  const listFloors = await req("GET", `${BASE_PHYSICAL}/floors`, null, token);
  check("GET /physical/floors → 200 tableau", listFloors, 200, b => Array.isArray(b));

  if (shelfId && adminUnitId) {
    const createFloor = await req("POST", `${BASE_PHYSICAL}/floors`, {
      number: 1,
      label: "Niveau test",
      shelf: shelfId,
      administrativeUnit: adminUnitId
    }, token);
    if (check("POST /physical/floors → 201", createFloor, 201, b => b._id && b.shelf === shelfId)) {
      floorId = createFloor.body._id;
    }

    if (floorId) {
      const byShelf = await req("GET", `${BASE_PHYSICAL}/floors/shelf/${shelfId}`, null, token);
      check("GET /physical/floors/shelf/:id → 200 tableau", byShelf, 200, b => Array.isArray(b));

      const getFloor = await req("GET", `${BASE_PHYSICAL}/floors/${floorId}`, null, token);
      check("GET /physical/floors/:id → 200", getFloor, 200, b => b._id === floorId);

      const updateFloor = await req("PUT", `${BASE_PHYSICAL}/floors/${floorId}`,
        { label: "Niveau test — mis à jour" }, token);
      check("PUT /physical/floors/:id → 200", updateFloor, 200);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 8. PHYSIQUE — Classeurs (CRUD + règle capacité/suppression)
  // ════════════════════════════════════════════════════════════════════════════

  section("8. Physique — Classeurs CRUD + règles métier");

  let binderId = null;

  const listBinders = await req("GET", `${BASE_PHYSICAL}/binders`, null, token);
  check("GET /physical/binders → 200 tableau", listBinders, 200, b => Array.isArray(b));

  if (floorId) {
    const createBinder = await req("POST", `${BASE_PHYSICAL}/binders`, {
      name: `CLASSEUR-TEST-${Date.now()}`,
      floor: floorId,
      nature: "TEST",
      maxCapacity: 2
    }, token);
    if (check("POST /physical/binders → 201", createBinder, 201, b => b._id && b.nature === "TEST")) {
      binderId = createBinder.body._id;
    }

    if (binderId) {
      const byFloor = await req("GET", `${BASE_PHYSICAL}/binders/floor/${floorId}`, null, token);
      check("GET /physical/binders/floor/:id → 200 tableau", byFloor, 200, b => Array.isArray(b));

      const getBinder = await req("GET", `${BASE_PHYSICAL}/binders/${binderId}`, null, token);
      check("GET /physical/binders/:id → 200 (avec currentCount)", getBinder, 200,
        b => b._id === binderId && typeof b.currentCount === "number");

      const updateBinder = await req("PUT", `${BASE_PHYSICAL}/binders/${binderId}`,
        { maxCapacity: 3 }, token);
      check("PUT /physical/binders/:id → 200", updateBinder, 200, b => b.maxCapacity === 3);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 9. PHYSIQUE — Dossiers (CRUD + règles métier)
  // ════════════════════════════════════════════════════════════════════════════

  section("9. Physique — Dossiers CRUD + règles métier");

  let recordId  = null;
  let recordQr  = null;

  const listRecords = await req("GET", `${BASE_PHYSICAL}/records`, null, token);
  check("GET /physical/records → 200 tableau", listRecords, 200, b => Array.isArray(b));

  const recordPayload = {
    internalNumber: `DOS-TEST-${Date.now()}`,
    refNumber:      `REF-TEST-${Date.now()}`,
    editionDate:    "2024-01-15",
    archivingDate:  "2024-03-01",
    subject:        "Dossier de test — intégration automatique",
    category:       "TEST",
    nature:         "TEST",
    binder:         binderId
  };

  if (binderId) {
    // 9.a Création normale
    const createRecord = await req("POST", `${BASE_PHYSICAL}/records`, recordPayload, token);
    if (check("POST /physical/records → 201", createRecord, 201,
        b => b._id && b.qrCode && b.nature === "TEST")) {
      recordId = createRecord.body._id;
      recordQr = createRecord.body.qrCode;
    }

    // 9.b Nature incompatible → 422
    const wrongNature = await req("POST", `${BASE_PHYSICAL}/records`, {
      ...recordPayload,
      internalNumber: `DOS-WRONG-${Date.now()}`,
      nature: "MAUVAISE_NATURE"
    }, token);
    check("POST /physical/records (nature incompatible) → 422", wrongNature, 422);

    if (recordId) {
      // 9.c Lecture par classeur
      const byBinder = await req("GET", `${BASE_PHYSICAL}/records/binder/${binderId}`, null, token);
      check("GET /physical/records/binder/:id → 200 tableau", byBinder, 200, b => Array.isArray(b));

      // 9.d Lecture par QR code
      const byQr = await req("GET", `${BASE_PHYSICAL}/records/qr/${recordQr}`, null, token);
      check("GET /physical/records/qr/:qrCode → 200", byQr, 200, b => b.qrCode === recordQr);

      // 9.e Lecture par id (hiérarchie complète)
      const getRecord = await req("GET", `${BASE_PHYSICAL}/records/${recordId}`, null, token);
      check("GET /physical/records/:id → 200 (hiérarchie peuplée)", getRecord, 200,
        b => b._id === recordId && b.binder !== null);

      // 9.f Mise à jour
      const updateRecord = await req("PUT", `${BASE_PHYSICAL}/records/${recordId}`,
        { subject: "Sujet mis à jour par les tests" }, token);
      check("PUT /physical/records/:id → 200", updateRecord, 200);

      // 9.g Règle métier : classeur plein (maxCapacity = 3, on crée record 2 et 3)
      const r2 = await req("POST", `${BASE_PHYSICAL}/records`, {
        ...recordPayload,
        internalNumber: `DOS-TEST2-${Date.now()}`
      }, token);
      const r3 = await req("POST", `${BASE_PHYSICAL}/records`, {
        ...recordPayload,
        internalNumber: `DOS-TEST3-${Date.now()}`
      }, token);
      // Le 4ème devrait être refusé (maxCapacity = 3)
      const r4 = await req("POST", `${BASE_PHYSICAL}/records`, {
        ...recordPayload,
        internalNumber: `DOS-TEST4-${Date.now()}`
      }, token);
      if (r2.status === 201 && r3.status === 201) {
        check("POST /physical/records (classeur plein, cap=3) → 422", r4, 422);
        // Nettoyage r2 et r3
        if (r2.body._id) await req("DELETE", `${BASE_PHYSICAL}/records/${r2.body._id}`, null, token);
        if (r3.body._id) await req("DELETE", `${BASE_PHYSICAL}/records/${r3.body._id}`, null, token);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 10. RÈGLE MÉTIER — suppression classeur non vide → 409
  // ════════════════════════════════════════════════════════════════════════════

  section("10. Règle métier — classeur non vide");

  if (binderId && recordId) {
    const delBinderFull = await req("DELETE", `${BASE_PHYSICAL}/binders/${binderId}`, null, token);
    check("DELETE /physical/binders/:id (non vide) → 409", delBinderFull, 409);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 11. NETTOYAGE — suppression dans l'ordre inverse (dossier → classeur → …)
  // ════════════════════════════════════════════════════════════════════════════

  section("11. Nettoyage — suppression en cascade inverse");

  if (recordId) {
    const delRecord = await req("DELETE", `${BASE_PHYSICAL}/records/${recordId}`, null, token);
    check("DELETE /physical/records/:id → 200", delRecord, 200);
  }
  if (binderId) {
    const delBinder = await req("DELETE", `${BASE_PHYSICAL}/binders/${binderId}`, null, token);
    check("DELETE /physical/binders/:id (vide) → 200", delBinder, 200);
  }
  if (floorId) {
    const delFloor = await req("DELETE", `${BASE_PHYSICAL}/floors/${floorId}`, null, token);
    check("DELETE /physical/floors/:id → 200", delFloor, 200);
  }
  if (shelfId) {
    const delShelf = await req("DELETE", `${BASE_PHYSICAL}/shelves/${shelfId}`, null, token);
    check("DELETE /physical/shelves/:id → 200", delShelf, 200);
  }
  if (containerId) {
    const delContainer = await req("DELETE", `${BASE_PHYSICAL}/containers/${containerId}`, null, token);
    check("DELETE /physical/containers/:id → 200", delContainer, 200);
  }

  summary();
}

// ── Résumé final ──────────────────────────────────────────────────────────────

function summary() {
  const total = passed + failed;
  console.log(`\n${BOLD}${"═".repeat(56)}${R}`);
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}  ✔  Tous les tests passent (${passed}/${total})${R}\n`);
  } else {
    console.log(`${RED}${BOLD}  ✘  ${failed} échec(s) / ${total} tests${R}`);
    console.log(`${GREEN}  ✔  ${passed} réussi(s)${R}\n`);
    console.log(`${YELLOW}${BOLD}  Échecs à corriger :${R}`);
    failures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.label}`);
      console.log(`     ${DIM}${f.reason}${R}`);
    });
    console.log();
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error(`\n  ${RED}[ERREUR FATALE]${R} ${err.message || err}\n`);
  process.exit(1);
});
