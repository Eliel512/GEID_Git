/**
 * _test-archives.js — Tests d'intégration du module Archives
 *
 * Teste l'ensemble du flux archive :
 *   1. Login de l'utilisateur test → obtenir un token JWT
 *   2. Accès refusé sans token (sécurité)
 *   3. GET /api/stuff/archives/archived → liste des archives validées
 *   4. GET /api/stuff/validate          → liste des archives à valider
 *   5. GET /api/stuff/archives/invalid  → liste des invalides (auth renforcée)
 *   6. GET /api/stuff/archives/invalid sans droits → refus 401
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

// ── Utilitaires HTTP ──────────────────────────────────────────────────────────

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Rapport de test ───────────────────────────────────────────────────────────

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";

let passed = 0;
let failed = 0;
let failedTests = [];

function ok(name) {
  console.log(`  ${GREEN}✔${RESET}  ${name}`);
  passed++;
}

function fail(name, reason) {
  console.log(`  ${RED}✘${RESET}  ${name}`);
  console.log(`     ${YELLOW}→ ${reason}${RESET}`);
  failed++;
  failedTests.push({ name, reason });
}

function section(title) {
  console.log(`\n${CYAN}${BOLD}── ${title} ──${RESET}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${CYAN}${BOLD}╔═══════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}${BOLD}║   GEID — Tests d'intégration module Archives      ║${RESET}`);
  console.log(`${CYAN}${BOLD}╚═══════════════════════════════════════════════════╝${RESET}`);
  console.log(`\n  Serveur : http://${HOST}:${PORT}`);
  console.log(`  Compte  : ${EMAIL}\n`);

  let token = null;

  // ── 1. Login ──────────────────────────────────────────────────────────────
  section("1. Authentification");

  try {
    const res = await request("POST", "/api/auth/login", { email: EMAIL, password: PASSWORD });

    if (res.status === 200 && res.body.token) {
      ok("POST /api/auth/login → 200 + token JWT");
      token = res.body.token;
    } else if (res.status === 404) {
      fail("POST /api/auth/login", `Utilisateur introuvable (404) — lancez d'abord : bash create-test-user.sh`);
    } else if (res.status === 401) {
      fail("POST /api/auth/login", `Compte non validé (401) — vérifiez isValid dans la BD`);
    } else if (res.status === 400) {
      fail("POST /api/auth/login", `Mot de passe incorrect (400)`);
    } else {
      fail("POST /api/auth/login", `Statut inattendu ${res.status} : ${JSON.stringify(res.body)}`);
    }
  } catch (e) {
    fail("POST /api/auth/login", `Serveur inaccessible : ${e.message} — vérifiez que le serveur tourne sur le port ${PORT}`);
  }

  if (!token) {
    console.log(`\n  ${RED}${BOLD}Login échoué — impossible de continuer les tests.${RESET}\n`);
    summary();
    return;
  }

  // ── 2. Accès refusé sans token ────────────────────────────────────────────
  section("2. Sécurité — accès sans token");

  try {
    const res = await request("GET", "/api/stuff/archives/archived");
    if (res.status === 401) {
      ok("GET /api/stuff/archives/archived sans token → 401 refusé");
    } else {
      fail("GET /api/stuff/archives/archived sans token", `Attendu 401, reçu ${res.status}`);
    }
  } catch (e) {
    fail("GET sans token", e.message);
  }

  // ── 3. Archives validées ──────────────────────────────────────────────────
  section("3. Archives validées");

  try {
    const res = await request("GET", "/api/stuff/archives/archived", null, token);
    if (res.status === 200 && Array.isArray(res.body)) {
      ok(`GET /api/stuff/archives/archived → 200 (${res.body.length} archive(s))`);
    } else if (res.status === 401) {
      fail("GET /api/stuff/archives/archived", "Non autorisé (401) — vérifiez les permissions dans l'Auth du test user");
    } else {
      fail("GET /api/stuff/archives/archived", `Statut ${res.status} : ${JSON.stringify(res.body)}`);
    }
  } catch (e) {
    fail("GET /api/stuff/archives/archived", e.message);
  }

  // ── 4. Archives à valider ─────────────────────────────────────────────────
  section("4. File de validation");

  try {
    const res = await request("GET", "/api/stuff/validate", null, token);
    if (res.status === 200 && Array.isArray(res.body)) {
      ok(`GET /api/stuff/validate → 200 (${res.body.length} archive(s) en attente)`);
    } else if (res.status === 401) {
      fail("GET /api/stuff/validate", "Non autorisé (401) — vérifiez les permissions archives dans l'Auth");
    } else {
      fail("GET /api/stuff/validate", `Statut ${res.status} : ${JSON.stringify(res.body)}`);
    }
  } catch (e) {
    fail("GET /api/stuff/validate", e.message);
  }

  // ── 5. Invalides (avec droits) ────────────────────────────────────────────
  section("5. Archives invalides (auth renforcée)");

  try {
    const res = await request("GET", "/api/stuff/archives/invalid", null, token);
    if (res.status === 200 && Array.isArray(res.body)) {
      ok(`GET /api/stuff/archives/invalid → 200 (${res.body.length} invalide(s))`);
    } else if (res.status === 401) {
      fail("GET /api/stuff/archives/invalid", "Refusé (401) alors que l'utilisateur test a les droits archives write");
    } else {
      fail("GET /api/stuff/archives/invalid", `Statut ${res.status} : ${JSON.stringify(res.body)}`);
    }
  } catch (e) {
    fail("GET /api/stuff/archives/invalid", e.message);
  }

  // ── 6. Refus sans droits archives ────────────────────────────────────────
  section("6. Sécurité — refus utilisateur sans droits archives");

  // On utilise un faux token généré localement (user fictif sans droits)
  // Ce test vérifie que le middleware rejette bien un token invalide/expiré
  const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NiIsImlhdCI6MTYwMDAwMDAwMH0.invalide";
  try {
    const res = await request("GET", "/api/stuff/archives/invalid", null, fakeToken);
    if (res.status === 401) {
      ok("GET /api/stuff/archives/invalid avec token invalide → 401 refusé");
    } else {
      fail("Sécurité token invalide", `Attendu 401, reçu ${res.status} — faille potentielle !`);
    }
  } catch (e) {
    fail("Sécurité token invalide", e.message);
  }

  summary();
}

function summary() {
  const total = passed + failed;
  console.log(`\n${BOLD}${"─".repeat(52)}${RESET}`);
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}  ✔  Tous les tests passent (${passed}/${total})${RESET}\n`);
  } else {
    console.log(`${RED}${BOLD}  ✘  ${failed} test(s) échoué(s) / ${total}${RESET}`);
    console.log(`${GREEN}  ✔  ${passed} test(s) réussi(s)${RESET}\n`);
    console.log(`${YELLOW}  Échecs à corriger :${RESET}`);
    failedTests.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name}`);
      console.log(`     ${t.reason}`);
    });
    console.log();
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error(`\n  [ERREUR FATALE] ${err.message || err}\n`);
  process.exit(1);
});
