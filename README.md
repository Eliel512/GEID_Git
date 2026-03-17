# GEID — Gestion Électronique des Informations et Documents

Plateforme de gestion documentaire et de collaboration en temps réel développée pour le **Ministère du Budget de la République Démocratique du Congo**.

Le système couvre l'intégralité du cycle de vie des archives administratives (dépôt → validation → archivage → rétention), la messagerie instantanée, les appels vidéo, et la gestion d'une médiathèque (bibliothèque, filmothèque, photothèque).

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Modèles de données](#4-modèles-de-données)
5. [Flux métier](#5-flux-métier)
6. [API REST](#6-api-rest)
7. [Temps réel — Socket.io](#7-temps-réel--socketio)
8. [Architecture distribuée](#8-architecture-distribuée)
9. [Installation et démarrage](#9-installation-et-démarrage)
10. [Variables d'environnement](#10-variables-denvironnement)
11. [Documentation API](#11-documentation-api)

---

## 1. Vue d'ensemble

GEID est une application **Node.js / Express** monolithique organisée selon le pattern **MVC**, déployable en cluster via **PM2** avec **Redis** comme bus de communication inter-processus.

### Modules fonctionnels

| Module | Description |
|--------|-------------|
| **Archives** | Dépôt, classification, validation et conservation des documents administratifs |
| **Workspace** | Espace de travail personnel par utilisateur pour préparer les documents |
| **Chat & Appels** | Messagerie directe/groupe, appels audio/vidéo WebRTC via Agora RTC |
| **Médiathèque** | Bibliothèque (livres/articles/revues), filmothèque, photothèque |
| **Événements** | Planification de réunions avec invitations iCal et notifications e-mail |
| **Administration** | Gestion des utilisateurs, rôles, permissions |
| **Analytics** | Tableau de bord des requêtes HTTP (volumes, temps de réponse, répartition horaire) |

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Serveur HTTP | Node.js 18+ · Express 4 |
| Temps réel | Socket.io 4 |
| Base de données | MongoDB 3.7 · Mongoose 5 |
| Cache / IPC | Redis 7 |
| Clustering | PM2 (4 workers fork) |
| Authentification | JWT (jsonwebtoken) · bcryptjs |
| Appels vidéo | Agora RTC Access Token |
| Upload fichiers | Multer |
| Validation | Joi · express-validator |
| E-mail | Nodemailer (SMTP Gmail) |
| Calendrier | ical-toolkit (.ics) |
| Conteneurisation | Docker Compose (MongoDB + Redis) |
| Documentation API | ReDoc (OpenAPI 3.0) |

---

## 3. Structure du projet

```
GEID_Git/
│
├── server.js                   # Point d'entrée — crée le serveur HTTP et attache Socket.io
├── worker.js                   # Point d'entrée alternatif avec cluster adapter Redis
├── app.js                      # Configuration Express (middlewares, routes, statiques)
├── socket.js                   # Initialisation Socket.io et enregistrement des handlers
├── ecosystem.config.js         # Configuration PM2 (4 workers, MongoDB, Redis)
├── docker-compose.yml          # Services Docker (mongo + redis avec volumes persistants)
├── config.js                   # Référentiel des types/sous-types d'archives (~25 catégories)
├── redisClient.js              # Client Redis partagé (singleton)
├── socketStore.js              # Annuaire des sockets (Redis, cross-worker)
├── serverStore.js              # Annuaire local au worker (fallback mémoire)
├── roomStore.js                # État en mémoire des salles d'appel actives
├── analytics_service.js        # Requêtes d'agrégation MongoDB pour le dashboard
│
├── models/                     # Schémas Mongoose
│   ├── users/
│   │   ├── user.model.js       # Utilisateur (identité, grade, role, contacts)
│   │   ├── role.model.js       # Unité administrative (parent, enfants, types de docs)
│   │   └── auth.model.js       # Autorisations par application et structure
│   ├── archives/
│   │   ├── archive.model.js    # Document archivé (type, validation, numéros de classement)
│   │   ├── doc.model.js        # Fichier brut dans le workspace
│   │   ├── event.model.js      # Événement administratif (TTL 48h après endDate)
│   │   ├── folder.model.js     # Dossier de classification
│   │   ├── invalid.model.js    # Archives rejetées en validation
│   │   ├── retention.model.js  # Calendrier de rétention (délai + arrangement)
│   │   ├── profil.model.js     # Profil d'accès (niveau de confidentialité)
│   │   └── type.model.js       # Type de document
│   ├── chats/
│   │   ├── chat.model.js       # Conversation directe ou salle de groupe
│   │   ├── message.model.js    # Message (text|doc|media|event|voice|call)
│   │   ├── callSession.model.js# Session d'appel Agora (TTL 24h)
│   │   ├── invitation.model.js # Invitation (connexion ou salon)
│   │   ├── space.model.js      # Espace collaboratif (membres, canaux)
│   │   └── guests.model.js     # Participants invités (sans compte)
│   ├── mediaLibrary/
│   │   ├── book.model.js       # Livre / article / revue / brochure
│   │   ├── film.model.js       # Vidéo
│   │   ├── image.model.js      # Image / photo
│   │   ├── cover.model.js      # Image de couverture
│   │   └── frozen.model.js     # Ressources mises en favoris
│   └── log/
│       ├── request_log.js      # Log HTTP (url, method, responseTime, day, hour)
│       ├── eventlog.model.js   # Journal d'événements métier
│       └── lifecycle.model.js  # Cycle de vie des documents
│
├── controllers/                # Handlers HTTP (logique métier)
│   ├── admin.js                # CRUD utilisateurs, rôles, permissions
│   ├── users/                  # Inscription, connexion, profil, édition
│   ├── archives/               # Dépôt, validation, consultation des archives
│   ├── invalids/               # Gestion des archives rejetées
│   ├── events/                 # CRUD événements administratifs
│   ├── chats/                  # Messagerie, invitations, salles, tokens Agora
│   ├── mediaLibrary/           # Bibliothèque, filmothèque, photothèque, couvertures
│   └── workspace.js            # Fichiers personnels (CRUD + lecture répertoire)
│
├── handlers/                   # Logique métier Socket.io
│   ├── socket.js               # Messages directs, appels P2P, statut, contacts
│   ├── room.js                 # Salles d'appel, planification de réunions (iCal)
│   ├── updates.js              # Mises à jour temps réel (contacts, historique)
│   └── room/                   # Classes JoinRoom, gestion des demandes d'accès
│
├── middleware/
│   ├── users/auth.js           # Vérification JWT (HTTP)
│   ├── adminAuth.js            # Vérification rôle admin
│   ├── socketAuth.js           # Vérification JWT (Socket.io)
│   ├── archives/               # Middlewares de validation pour les archives
│   ├── multer-chat.js          # Upload fichiers chat (avec routing par type)
│   ├── multer-work.js          # Upload workspace
│   ├── multer-config.js        # Upload médiathèque (path sécurisé)
│   └── addCover.js             # Upload couvertures
│
├── routes/                     # Définition des endpoints Express
├── tools/                      # Utilitaires (JWT, generateId, parseClientInfo…)
├── events/                     # EventEmitter Node.js (ex: doc.js)
├── docs/                       # Documentation API (OpenAPI 3.0 + ReDoc)
└── public/                     # SPA frontends chargées dynamiquement
```

---

## 4. Modèles de données

### Utilisateur

```js
{
  fname, mname, lname,          // Prénom, deuxième prénom, nom
  email,                        // Unique, validé
  password,                     // Haché (bcrypt, 10 rounds)
  phoneCell,                    // Unique, format numérique
  grade: {
    grade: String,              // Ex : "DIRECTEUR", "CHEF DE DIVISION"
    role:  String               // Ex : "DIRECTION GÉNÉRALE DES RESSOURCES"
  },
  isValid: Boolean,             // Compte validé par e-mail
  contacts: [ObjectId],         // Relations utilisateur ↔ utilisateur
  imageUrl: String,             // Photo de profil
  auth: ObjectId                // → auth.model (autorisations)
}
```

### Hiérarchie des grades (config.js)

La hiérarchie est définie dans `config.js` sous forme d'un référentiel de grades associés aux unités administratives (roles) :

```
SECRETAIRE GENERAL
  └── DIRECTEUR GENERAL
        └── DIRECTEUR
              ├── CHEF DE DIVISION / CHEF DE CELLULE / CHEF DE CORPS
              │     └── CHEF DE BUREAU
              │           └── SECRETAIRE
              └── AGENT
```

Chaque `Role` (unité administrative) possède un champ `parent` et `children` permettant de valider qu'un utilisateur a bien le droit d'accéder aux archives d'une unité inférieure à la sienne.

### Archive

```js
{
  type: {
    type:    String,            // Catégorie principale (ex : "CORRESPONDANCES")
    subtype: String,            // Sous-catégorie (ex : "COURRIERS ENTRANTS")
    profil:  ObjectId           // → profil.model (niveau de confidentialité)
  },
  designation:        String,
  description:        String,
  language:           String,   // Défaut : "FR"
  tags:               [String],
  administrativeUnit: ObjectId, // → role.model (unité créatrice)
  folder:             ObjectId, // → folder.model
  validated:          Boolean,  // false jusqu'à validation par un administrateur
  classNumber:        String,   // Attribué à la validation
  refNumber:          String,   // Numéro de référence officiel
  fileUrl:            String    // Chemin dans ./ARCHIVES/<role>/<folder>/
}
```

### CallSession (session d'appel)

```js
{
  _id:          String,         // ID court 6-9 chars (SHA1 tronqué)
  title:        String,
  status:       Number,         // 0 planifiée · 1 en cours · 2 terminée
  createdBy:    ObjectId,
  location:     ObjectId,       // → chat.model (conversation parente)
  participants: [{
    identity:  ObjectId,        // → users ou guests
    uid:       Number,          // UID Agora
    state: {
      isOrganizer, handRaised, screenShared,
      isCamActive, isMicActive, isInRoom
    },
    auth: { shareScreen, writeMessage, activateCam, activateMic, … }
  }],
  messages:     [{ content, sender, createdAt, clientId }],
  duration:     { hours, minutes, seconds },
  startedAt, endedAt            // ISO strings
  // TTL MongoDB : 24h (suppression automatique)
}
```

### Types d'archives (extrait de config.js)

Le référentiel contient environ **25 catégories** avec leurs sous-types :

| Catégorie | Exemples de sous-types |
|-----------|------------------------|
| CORRESPONDANCES | Courriers entrants, sortants, sensibles, urgents |
| NOTES | Circulaires, techniques, instructions, directives, normes |
| RAPPORTS | De service, de mission, d'activité, de stage |
| PLANS | Stratégiques, opérationnels, trimestriels, classifications |
| BONS | D'entrée, de sortie |
| PROCES-VERBAUX | — |
| COMPTES-RENDUS | — |
| LIVRES | — |
| … | … (~17 autres) |

---

## 5. Flux métier

### 5.1 Cycle de vie d'une archive

```
1. DÉPÔT
   L'utilisateur upload un fichier via son workspace.
   → Fichier sauvegardé dans ./workspace/<userId>/
   → Un document Doc est créé en base (format, owner, contentUrl)

2. SOUMISSION
   L'utilisateur soumet le document pour archivage.
   → Le fichier est copié vers ./ARCHIVES/<unité>/<dossier>/
   → Une Archive est créée (validated: false)

3. VALIDATION
   Un responsable attribue un numéro de classement et de référence.
   → Archive mise à jour : classNumber, refNumber, validated: true

4. CONSERVATION / DESTRUCTION
   Le modèle Retention définit un délai (en années) et un arrangement :
   • Conservation → le document reste accessible
   • Destruction  → le document est supprimé à l'échéance
```

### 5.2 Appel vidéo entre deux utilisateurs

```
A → socket "call"       { to: userId_B }
                        ↓
Server              trouve les sockets de B (Redis)
                    émet "call" { from: A } → B

B → socket "pick-up"   { to: userId_A }
                        ↓
A + B ←→ socket "signal"  (SDP offer/answer + ICE candidates WebRTC)
                        ↓
Agora RTC            connexion directe chiffrée entre A et B

A ou B → "hang-up"      Server nettoie la session
```

### 5.3 Planification d'une réunion

```
Organisateur → socket "schedule"  { members, date, heure, lieu }
                        ↓
Server              génère un fichier .ics (ical-toolkit)
                    construit un e-mail HTML avec bouton d'acceptation
                    envoie via Nodemailer (SMTP Gmail) à chaque membre
                    émet "schedule" à tous via Socket.io
                        ↓
Membres             reçoivent l'invitation dans leur client mail
                    le fichier .ics est reconnu par Outlook / Google Calendar
```

### 5.4 Connexion d'un utilisateur (WebSocket)

```
Client    → socket.connect  { query: { token: <JWT> } }
                        ↓
socketAuth.js       vérifie et décode le JWT
                        ↓
socketStore.js      enregistre la socket dans Redis (cross-worker)
                        ↓
handlers/socket.js  émet "connexion" avec contacts en ligne + invitations + historique
```

---

## 6. API REST

Le serveur expose trois racines :

| Préfixe | Protection | Description |
|---------|-----------|-------------|
| `/api` | JWT (certaines routes) | Routes principales |
| `/admin` | JWT + rôle admin | Administration |
| `/api-docs` | Publique | Documentation ReDoc |

### Groupes de routes

```
/api/auth
  POST  /signup             Créer un compte
  POST  /login              Se connecter → retourne JWT
  POST  /validate           Valider le compte (e-mail)
  POST  /profil         🔒  Changer la photo de profil
  POST  /edit           🔒  Modifier email / téléphone / mot de passe
  GET   /init               Configuration initiale (grades/rôles)
  GET   /users              Liste des utilisateurs
  POST  /check              Vérifier si un e-mail existe

/api/stuff/workspace      🔒 (+ workAuth)
  GET   /:data              Lister les fichiers d'un dossier
  POST  /                   Uploader un fichier
  PUT   /                   Renommer un fichier
  DELETE /:data             Supprimer un fichier

/api/stuff/archives       🔒
  GET   /archived           Archives validées
  GET   /:role              Archives d'une unité administrative
  POST  /                   Déposer une archive
  /invalid                  Gestion des archives rejetées (GET / POST / DELETE /:id)
  /event                    Événements administratifs (GET / GET /:role / POST / DELETE /:id)

/api/stuff/validate       🔒
  GET   /                   Archives en attente de validation
  POST  /                   Valider / rejeter une archive

/api/stuff/bibliotheque
  GET   /                   Lister les livres
  GET   /types              Types disponibles
  GET   /:id                Un livre
  POST  /                   Ajouter un livre

/api/stuff/filmotheque
  GET | POST | PUT | DELETE /
  GET | DELETE /:id

/api/stuff/phototheque
  GET | POST | DELETE /
  GET | PUT | DELETE /:id

/api/stuff/frozen         🔒
  GET | DELETE /:datas
  POST /

/api/stuff/cover          🔒
  GET | POST /
  POST /set                 Associer une couverture à un élément
  DELETE /:name

/api/chat                 🔒
  GET   /                   Toutes les conversations
  POST  /call/create        Créer une session d'appel Agora
  POST  /guest/create       Accès invité (public)
  POST  /direct             Envoyer un fichier en message direct
  POST  /file               Envoyer un fichier dans une salle
  POST  /invite             Envoyer une invitation
  POST  /reject             Rejeter une invitation
  POST  /accept             Accepter une invitation
  GET   /invites            Invitations reçues
  POST  /room/call          Créer une salle d'appel RTC
  GET   /room/call          Historique des appels
  POST  /room/call/register Enregistrer un participant (invité)
  GET   /room/call/:id      Détails d'un appel
  POST  /room/new           Créer une salle de chat
  PUT   /room/edit          Modifier une salle de chat
  GET   /rtc/:type/:target/:role/:tokenType  Token Agora RTC

/admin                    🔒 + 👑 admin
  GET | POST | PUT  /users
  GET               /users/:datas
  PUT               /users/permissions
  PUT               /users/permissions/:mode   (add | remove)
  GET | POST        /roles
  GET               /:userId
```

🔒 = JWT requis · 👑 = rôle admin requis

---

## 7. Temps réel — Socket.io

### Événements disponibles

| Événement | Sens | Description |
|-----------|------|-------------|
| `direct-message` | C → S | Envoyer un message texte à un contact |
| `direct-file` | C → S | Partager un fichier directement |
| `room-message` | C → S | Message dans une salle de groupe |
| `call` | C → S | Initier un appel vers un utilisateur |
| `pick-up` | C → S | Décrocher un appel entrant |
| `hang-up` | C → S | Raccrocher |
| `ringing` | S → C | L'appelé sonne |
| `busy` | S → C | L'appelé est occupé |
| `signal` | C ↔ S | Signalisation WebRTC (SDP offer/answer, ICE) |
| `create` | C → S | Créer une salle d'appel |
| `join-room` | C → S | Rejoindre une salle (nouveau protocole) |
| `request-join-room` | C → S | Demander accès à une salle verrouillée |
| `response-join-room` | S → C | Réponse à la demande d'accès |
| `leave` | C → S | Quitter une salle |
| `edit-room` | C → S | Modifier les paramètres d'une salle |
| `schedule` | C → S | Planifier une réunion (→ iCal + e-mail) |
| `status` | C → S | Changer son statut (online/offline/away) |
| `contacts` | C → S | Demander la liste des contacts |
| `last` | C → S | Récupérer l'historique récent |
| `call-history` | C → S | Récupérer l'historique des appels |
| `rtt-ping` | C → S | Mesure de la latence réseau |
| `disconnect` | — | Déconnexion (nettoyage automatique) |

---

## 8. Architecture distribuée

### Clustering PM2

```
Nginx (reverse proxy)
    │
    ├── Worker 0  :3000
    ├── Worker 1  :3001
    ├── Worker 2  :3002
    └── Worker 3  :3003
          │
      Redis (IPC)
          │
       MongoDB
```

`ecosystem.config.js` lance 4 instances avec la variable `PORT` incrémentée automatiquement. La variable d'environnement `increment_var: "PORT"` est gérée nativement par PM2.

### SocketStore — Annuaire cross-worker

`socketStore.js` gère la découverte des sockets entre workers via Redis :

| Clé Redis | Valeur | Usage |
|-----------|--------|-------|
| `SOCKET_DATA:<socketId>` | `{ clientId, rooms[], connectedAt }` | Retrouver un client |
| `GUEST_DATA:<guestId>` | données invité | Accès invité temporaire |

**Méthodes clés** :
- `addClient(socketId, clientId)` — enregistrement à la connexion
- `deleteClient(socketId)` — nettoyage à la déconnexion
- `getClientSockets(clientId)` — toutes les sockets d'un utilisateur (multi-onglets, multi-workers)
- `getRoomParticipantsCount(roomId)` — participants uniques dans une salle

### Docker Compose

```yaml
services:
  mongo:   image: mongo:latest    # Port 27017 · Données dans ./data/mongodb
  redis:   image: redis:latest    # Port 6379  · Données dans ./data/redis
```

---

## 9. Installation et démarrage

### Prérequis

- Node.js 18+
- pnpm (ou npm)
- Docker & Docker Compose
- PM2 (`npm install -g pm2`)

### Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd GEID_Git

# Installer les dépendances
pnpm install

# Copier et remplir les variables d'environnement
cp .env.example .env
```

### Démarrage — Développement

```bash
# Lancer MongoDB + Redis via Docker
docker compose up -d

# Attendre que les services soient prêts puis lancer l'app
./start-dev.sh
# Équivalent à : pm2 start ecosystem.config.js --env production
```

### Arrêt

```bash
./stop-dev.sh
# Équivalent à : pm2 stop GEID && docker compose down
```

### Démarrage manuel (sans PM2)

```bash
node server.js
```

### Commandes PM2 utiles

```bash
pm2 logs GEID          # Logs en temps réel
pm2 monit              # Dashboard CPU/mémoire
pm2 restart GEID       # Redémarrage sans coupure
pm2 reload GEID        # Rechargement gracieux (0-downtime)
pm2 status             # État de tous les processus
```

---

## 10. Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute du serveur | `3000` |
| `NODE_ENV` | Environnement (`development` / `production`) | `production` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://127.0.0.1:27017/geid` |
| `REDIS_URL` | URI de connexion Redis | `redis://127.0.0.1:6379` |
| `TOKEN_KEY` | Clé secrète pour signer les JWT | chaîne aléatoire forte |
| `GEID_EMAIL` | Adresse Gmail pour les envois e-mail | `noreply@domain.com` |
| `GEID_PASS` | Mot de passe d'application Gmail | — |
| `AGORA_APP_ID` | Identifiant de l'application Agora RTC | — |
| `AGORA_APP_CERTIFICATE` | Certificat Agora pour la génération de tokens | — |

> **Note** : Ne jamais committer le fichier `.env`. Toutes les valeurs sensibles doivent rester dans les variables d'environnement ou un coffre-fort de secrets.

---

## 11. Documentation API

La documentation interactive (ReDoc) est disponible au démarrage du serveur :

```
http://localhost:<PORT>/api-docs
```

La spécification OpenAPI brute (JSON) est accessible sur :

```
http://localhost:<PORT>/api-docs/spec.json
```

La spécification est définie dans [`docs/swagger.js`](docs/swagger.js) et couvre l'intégralité des 60+ endpoints.

---

## Conventions de code

- Messages utilisateur en **français**
- Nommage des variables en **anglais** (camelCase)
- Pattern MVC strict : routes → middleware → controller → model
- Gestion d'erreurs : messages génériques côté client, détails uniquement dans `console.log` côté serveur
- Tous les uploads de fichiers passent par un middleware Multer dédié avec validation du chemin
