'use strict';

/**
 * docs/swagger.js — Spécification OpenAPI 3.0 complète de l'API GEID
 *
 * Couvre toutes les routes définies dans :
 *   - routes/admin.js          → /admin/*
 *   - routes/user.routes.js    → /api/auth/*
 *   - routes/workspace.js      → /api/stuff/workspace/*
 *   - routes/archive.routes.js → /api/stuff/archives/*
 *   - routes/invalid.routes.js → /api/stuff/archives/invalid/*
 *   - routes/event.routes.js   → /api/stuff/archives/event/*
 *   - routes/validate.route.js → /api/stuff/validate/*
 *   - routes/book.routes.js    → /api/stuff/bibliotheque/*
 *   - routes/film.routes.js    → /api/stuff/filmotheque/*
 *   - routes/image.routes.js   → /api/stuff/phototheque/*
 *   - routes/frozen.js         → /api/stuff/frozen/*
 *   - routes/cover.js          → /api/stuff/cover/*
 *   - routes/chat.js           → /api/chat/*
 *   - routes/physical.routes.js → /api/stuff/archives/physical/*
 */

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GEID API',
    version: '1.0.0',
    description:
      'Documentation complète de l\'API REST GEID.\n\n' +
      '**Authentification :** Les routes protégées nécessitent un token JWT transmis dans le header `Authorization: Bearer <token>`.\n\n' +
      '**Rôle admin :** Les routes `/admin/*` nécessitent en plus le rôle administrateur.',
    contact: {
      name: 'GEID',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Serveur local de développement',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via POST /api/auth/login',
      },
    },
    schemas: {
      // ── Génériques ────────────────────────────────────────────────────────
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Message d\'erreur' },
        },
      },
      // ── Utilisateurs ─────────────────────────────────────────────────────
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          username: { type: 'string', example: 'johndoe' },
          role: { type: 'string', example: 'user' },
          permissions: { type: 'array', items: { type: 'string' }, example: ['read', 'write'] },
        },
      },
      SignupBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', format: 'password', example: 'motdepasse123' },
          username: { type: 'string', example: 'johndoe' },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', format: 'password', example: 'motdepasse123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      // ── Archives ─────────────────────────────────────────────────────────
      Archive: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
          title: { type: 'string', example: 'Document important' },
          role: { type: 'string', example: 'admin' },
          validated: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Archivage physique ───────────────────────────────────────────────
      //
      // Hiérarchie : Conteneur → Étagère → Étage → Classeur → Dossier → Archive
      //
      // Chaque entité "Body" décrit le corps de requête attendu pour la
      // création (POST) ou la modification (PUT). Les champs marqués comme
      // `required` dans le Body sont obligatoires à la création.

      // ── Container (Conteneur — niveau racine) ────────────────────────────
      Container: {
        type: 'object',
        description:
          'Unité de stockage physique de plus haut niveau dans la hiérarchie d\'archivage. ' +
          'Représente typiquement une armoire, une salle d\'archives ou un meuble identifié. ' +
          'Un conteneur peut contenir plusieurs étagères (Shelf).',
        properties: {
          _id: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e1',
            description: 'Identifiant unique MongoDB (ObjectId) généré automatiquement.',
          },
          name: {
            type: 'string',
            example: 'ARMOIRE-A',
            description: 'Nom du conteneur, stocké en majuscules. Doit être unique dans la collection.',
          },
          description: {
            type: 'string',
            example: 'Armoire principale — documents administratifs 2020-2024',
            description: 'Description libre : dimensions, couleur, identifiant interne, etc. Facultatif.',
          },
          location: {
            type: 'string',
            example: 'Bâtiment principal, salle 102, couloir Nord',
            description: 'Localisation physique précise dans les locaux. Facultatif mais recommandé pour la traçabilité.',
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Date de création (gérée automatiquement par Mongoose).' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Date de dernière modification (gérée automatiquement par Mongoose).' },
        },
      },
      ContainerBody: {
        type: 'object',
        description: 'Corps de requête pour la création ou la modification d\'un conteneur.',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            example: 'ARMOIRE-A',
            description: 'Nom du conteneur (obligatoire). Automatiquement converti en majuscules. Doit être unique.',
          },
          description: {
            type: 'string',
            example: 'Armoire principale — documents administratifs 2020-2024',
            description: 'Description libre. Facultatif.',
          },
          location: {
            type: 'string',
            example: 'Bâtiment principal, salle 102, couloir Nord',
            description: 'Localisation physique dans les locaux. Facultatif.',
          },
        },
      },

      // ── Shelf (Étagère — niveau 2) ───────────────────────────────────────
      Shelf: {
        type: 'object',
        description:
          'Subdivision d\'un conteneur. Une étagère représente un rayon, une travée ou un casier ' +
          'numéroté à l\'intérieur d\'une armoire. Elle regroupe plusieurs étages (Floor), chacun ' +
          'pouvant être attribué à une unité administrative différente.',
        properties: {
          _id: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e2',
            description: 'Identifiant unique MongoDB (ObjectId).',
          },
          name: {
            type: 'string',
            example: 'ETAGERE-01',
            description: 'Nom de l\'étagère, stocké en majuscules.',
          },
          container: {
            $ref: '#/components/schemas/Container',
            description: 'Conteneur parent peuplé automatiquement dans les réponses de lecture.',
          },
          description: {
            type: 'string',
            example: 'Travée gauche — dossiers RH 2020-2022',
            description: 'Description libre de l\'étagère. Facultatif.',
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Date de création.' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Date de dernière modification.' },
        },
      },
      ShelfBody: {
        type: 'object',
        description: 'Corps de requête pour la création ou la modification d\'une étagère.',
        required: ['name', 'container'],
        properties: {
          name: {
            type: 'string',
            example: 'ETAGERE-01',
            description: 'Nom de l\'étagère (obligatoire). Converti en majuscules.',
          },
          container: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e1',
            description: '_id MongoDB du conteneur parent (obligatoire). Doit être un ObjectId valide.',
          },
          description: {
            type: 'string',
            example: 'Travée gauche — dossiers RH 2020-2022',
            description: 'Description libre. Facultatif.',
          },
        },
      },

      // ── Floor (Étage — niveau 3) ─────────────────────────────────────────
      Floor: {
        type: 'object',
        description:
          'Niveau numéroté à l\'intérieur d\'une étagère. L\'étage constitue le pont entre ' +
          'la localisation physique (étagère → conteneur) et l\'organisation administrative ' +
          '(unité administrative / rôle). Il permet de répondre à : ' +
          '"Quel service utilise ce niveau d\'étagère ?"',
        properties: {
          _id: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e3',
            description: 'Identifiant unique MongoDB (ObjectId).',
          },
          number: {
            type: 'integer',
            example: 2,
            description: 'Numéro d\'ordre physique de l\'étage dans l\'étagère parente (1, 2, 3…). Permet le tri et l\'affichage ordonné.',
          },
          label: {
            type: 'string',
            example: 'Niveau 2 — Ressources Humaines 2019-2023',
            description: 'Libellé descriptif de l\'étage. Facultatif mais utile pour l\'interface utilisateur.',
          },
          shelf: {
            $ref: '#/components/schemas/Shelf',
            description: 'Étagère parente peuplée automatiquement dans les réponses de lecture.',
          },
          administrativeUnit: {
            type: 'object',
            description: 'Unité administrative (rôle) responsable de cet étage, peuplée automatiquement.',
            properties: {
              _id:  { type: 'string', description: 'ObjectId du rôle.' },
              name: { type: 'string', description: 'Nom du rôle / de la direction.' },
            },
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Date de création.' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Date de dernière modification.' },
        },
      },
      FloorBody: {
        type: 'object',
        description: 'Corps de requête pour la création ou la modification d\'un étage.',
        required: ['number', 'shelf', 'administrativeUnit'],
        properties: {
          number: {
            type: 'integer',
            example: 2,
            description: 'Numéro de l\'étage dans l\'étagère (obligatoire). Entier positif.',
          },
          label: {
            type: 'string',
            example: 'Niveau 2 — Ressources Humaines',
            description: 'Libellé descriptif. Facultatif.',
          },
          shelf: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e2',
            description: '_id MongoDB de l\'étagère parente (obligatoire). Doit être un ObjectId valide.',
          },
          administrativeUnit: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e0',
            description: '_id MongoDB du rôle / unité administrative responsable (obligatoire). Doit être un ObjectId valide.',
          },
        },
      },

      // ── Binder (Classeur — niveau 4) ─────────────────────────────────────
      Binder: {
        type: 'object',
        description:
          'Conteneur direct des dossiers physiques, positionné sur un étage. ' +
          'Le classeur est l\'entité régulatrice du flux : il impose une nature unique ' +
          '(seuls les dossiers de même nature peuvent y être rangés) et une capacité ' +
          'maximale (aucun dossier supplémentaire n\'est accepté au-delà du plafond). ' +
          'La suppression d\'un classeur non vide est refusée (HTTP 409).',
        properties: {
          _id: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e4',
            description: 'Identifiant unique MongoDB (ObjectId).',
          },
          name: {
            type: 'string',
            example: 'CLASSEUR-RH-01',
            description: 'Nom du classeur, stocké en majuscules.',
          },
          floor: {
            $ref: '#/components/schemas/Floor',
            description: 'Étage parent peuplé automatiquement dans les réponses de lecture.',
          },
          nature: {
            type: 'string',
            example: 'RH',
            description:
              'Spécialité du classeur (ex : "RH", "FINANCE", "JURIDIQUE"). ' +
              'Stockée en majuscules. Détermine quels dossiers peuvent y être placés : ' +
              'un dossier doit avoir exactement la même nature pour être accepté.',
          },
          maxCapacity: {
            type: 'integer',
            example: 50,
            description: 'Nombre maximal de dossiers autorisés dans ce classeur (minimum 1). Toute tentative de dépassement est refusée avec HTTP 422.',
          },
          currentCount: {
            type: 'integer',
            example: 12,
            description:
              'Nombre de dossiers actuellement présents dans le classeur. ' +
              'Champ calculé dynamiquement par le serveur (non stocké en base). ' +
              'Disponible uniquement dans la réponse de GET /binders/:id.',
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Date de création.' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Date de dernière modification.' },
        },
      },
      BinderBody: {
        type: 'object',
        description: 'Corps de requête pour la création ou la modification d\'un classeur.',
        required: ['name', 'floor', 'nature', 'maxCapacity'],
        properties: {
          name: {
            type: 'string',
            example: 'CLASSEUR-RH-01',
            description: 'Nom du classeur (obligatoire). Converti en majuscules.',
          },
          floor: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e3',
            description: '_id MongoDB de l\'étage parent (obligatoire). Doit être un ObjectId valide.',
          },
          nature: {
            type: 'string',
            example: 'RH',
            description:
              'Nature / spécialité du classeur (obligatoire). Converti en majuscules. ' +
              'Exemples : "RH", "FINANCE", "JURIDIQUE", "TECHNIQUE". ' +
              'Un dossier ne peut être ajouté que si sa nature est identique.',
          },
          maxCapacity: {
            type: 'integer',
            example: 50,
            minimum: 1,
            description: 'Capacité maximale en nombre de dossiers (obligatoire, minimum 1).',
          },
        },
      },

      // ── Record (Dossier physique — niveau 5) ─────────────────────────────
      Record: {
        type: 'object',
        description:
          'Entité pivot du système d\'archivage physique. Représente le dossier cartonné réel ' +
          'placé dans un classeur. Possède un QR code unique (UUID v4) généré automatiquement ' +
          'à la création, destiné à être imprimé et collé sur le dossier physique pour assurer ' +
          'le lien physique-numérique. ' +
          'Deux règles métier protègent l\'intégrité : ' +
          '(1) la nature du dossier doit correspondre à celle du classeur cible ; ' +
          '(2) le classeur ne doit pas être plein.',
        properties: {
          _id: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e5',
            description: 'Identifiant unique MongoDB (ObjectId).',
          },
          internalNumber: {
            type: 'string',
            example: 'DOS-2024-0042',
            description:
              'Numéro interne attribué par l\'organisation selon sa propre nomenclature. ' +
              'Doit être unique dans toute la collection. Exemple : "DOS-2024-0042", "DRH-2024-001".',
          },
          refNumber: {
            type: 'string',
            example: 'REF-MINISTERE-2024-007',
            description:
              'Numéro de référence externe, provenant d\'un système tiers, d\'un courrier ' +
              'officiel ou d\'une procédure administrative externe.',
          },
          editionDate: {
            type: 'string',
            format: 'date',
            example: '2024-01-15',
            description:
              'Date d\'édition (création) du document physique contenu dans le dossier. ' +
              'Correspond à la date figurant sur le document lui-même, pas à la date d\'archivage.',
          },
          archivingDate: {
            type: 'string',
            format: 'date',
            example: '2024-03-01',
            description:
              'Date à laquelle le dossier a été physiquement placé en archive. ' +
              'Peut différer de editionDate si le document a circulé avant archivage.',
          },
          subject: {
            type: 'string',
            example: 'Contrat de travail — Jean Dupont',
            description: 'Objet / sujet principal du dossier. Résumé court décrivant le contenu ou la finalité.',
          },
          category: {
            type: 'string',
            example: 'Contrats',
            description: 'Catégorie selon la classification interne de l\'organisation. Exemples : "Contrats", "Marchés", "Correspondances".',
          },
          nature: {
            type: 'string',
            example: 'RH',
            description:
              'Nature du dossier, stockée en majuscules. ' +
              'CONTRAINTE : doit être identique à binder.nature. ' +
              'Vérifiée côté serveur — toute incompatibilité renvoie HTTP 422.',
          },
          binder: {
            $ref: '#/components/schemas/Binder',
            description: 'Classeur parent peuplé automatiquement dans les réponses de lecture (getOne, getByQrCode).',
          },
          agent: {
            type: 'object',
            description:
              'Utilisateur ayant introduit le dossier dans le système. ' +
              'Renseigné automatiquement par le serveur (utilisateur authentifié) — ' +
              'ne pas fournir dans le corps de la requête.',
            properties: {
              _id:       { type: 'string',  description: 'ObjectId de l\'utilisateur.' },
              firstName: { type: 'string',  description: 'Prénom.' },
              lastName:  { type: 'string',  description: 'Nom de famille.' },
            },
          },
          qrCode: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
            description:
              'UUID v4 généré automatiquement à la création via crypto.randomUUID(). ' +
              'Destiné à être imprimé sur le dossier cartonné physique. ' +
              'Permet de retrouver la fiche numérique via GET /records/qr/:qrCode. ' +
              'Ne jamais fournir dans le corps de la requête (ignoré / rejeté par l\'unicité).',
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
            example: { visa: 'DRH', urgent: true, nbPages: 42, cote: 'A-12-RH' },
            description:
              'Champ JSON libre pour des informations complémentaires non prévues dans le schéma standard. ' +
              'Permet à chaque organisation d\'ajouter ses propres attributs sans modifier la base. ' +
              'Facultatif. Exemples : visa du responsable, niveau de confidentialité, cotation, etc.',
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Date de création du dossier numérique.' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Date de dernière modification.' },
        },
      },
      RecordBody: {
        type: 'object',
        description:
          'Corps de requête pour la création ou la modification d\'un dossier. ' +
          'Le champ `agent` est injecté automatiquement (utilisateur connecté) et ne doit pas être fourni. ' +
          'Le champ `qrCode` est généré automatiquement à la création et ne peut pas être modifié.',
        required: ['internalNumber', 'refNumber', 'editionDate', 'archivingDate', 'subject', 'category', 'nature', 'binder'],
        properties: {
          internalNumber: {
            type: 'string',
            example: 'DOS-2024-0042',
            description: 'Numéro interne unique selon la nomenclature de l\'organisation (obligatoire).',
          },
          refNumber: {
            type: 'string',
            example: 'REF-MINISTERE-2024-007',
            description: 'Numéro de référence externe (obligatoire).',
          },
          editionDate: {
            type: 'string',
            format: 'date',
            example: '2024-01-15',
            description: 'Date de création du document physique (obligatoire). Format ISO 8601 : YYYY-MM-DD.',
          },
          archivingDate: {
            type: 'string',
            format: 'date',
            example: '2024-03-01',
            description: 'Date de mise en archive physique (obligatoire). Format ISO 8601 : YYYY-MM-DD.',
          },
          subject: {
            type: 'string',
            example: 'Contrat de travail — Jean Dupont',
            description: 'Objet principal du dossier (obligatoire).',
          },
          category: {
            type: 'string',
            example: 'Contrats',
            description: 'Catégorie selon la classification interne (obligatoire).',
          },
          nature: {
            type: 'string',
            example: 'RH',
            description:
              'Nature du dossier (obligatoire). ' +
              'RÈGLE MÉTIER : doit correspondre exactement à binder.nature (insensible à la casse — converti en majuscules). ' +
              'Une incompatibilité déclenche HTTP 422.',
          },
          binder: {
            type: 'string',
            example: '64a1b2c3d4e5f6a7b8c9d0e4',
            description:
              '_id MongoDB du classeur cible (obligatoire). ' +
              'Le classeur doit exister, avoir la même nature et ne pas être plein. ' +
              'Toute violation déclenche HTTP 422.',
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
            example: { visa: 'DRH', urgent: true, nbPages: 42 },
            description: 'Métadonnées libres JSON. Facultatif.',
          },
        },
      },
      // ── Chat ─────────────────────────────────────────────────────────────
      Room: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
          name: { type: 'string', example: 'Salle de réunion' },
          participants: { type: 'array', items: { type: 'string' } },
        },
      },
      // ── Médias ───────────────────────────────────────────────────────────
      Book: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
          title: { type: 'string', example: 'Le Petit Prince' },
          author: { type: 'string', example: 'Antoine de Saint-Exupéry' },
          type: { type: 'string', example: 'roman' },
        },
      },
      Film: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
          title: { type: 'string', example: 'Inception' },
          director: { type: 'string', example: 'Christopher Nolan' },
        },
      },
      Image: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
          name: { type: 'string', example: 'photo.jpg' },
          url: { type: 'string', example: '/imgs/photo.jpg' },
        },
      },
    },
  },

  // ─── Tags (groupes) ────────────────────────────────────────────────────────
  tags: [
    { name: 'Auth',         description: 'Authentification et gestion du compte utilisateur' },
    { name: 'Admin',        description: 'Administration — nécessite le rôle admin' },
    { name: 'Workspace',    description: 'Gestion de l\'espace de travail (fichiers/dossiers)' },
    { name: 'Archives',     description: 'Archives de documents' },
    { name: 'Invalides',    description: 'Gestion des archives invalides' },
    { name: 'Événements',   description: 'Événements liés aux archives' },
    { name: 'Validation',   description: 'Validation des archives en attente' },
    { name: 'Bibliothèque', description: 'Gestion de la bibliothèque (livres)' },
    { name: 'Filmothèque',  description: 'Gestion de la filmothèque' },
    { name: 'Photothèque',  description: 'Gestion de la photothèque (images)' },
    { name: 'Favoris',      description: 'Éléments gelés / mis en favoris' },
    { name: 'Couvertures',  description: 'Gestion des images de couverture' },
    { name: 'Chat',              description: 'Messagerie, appels et salles de chat' },
    { name: 'Archivage Physique', description: 'Hiérarchie physique d\'archivage : Conteneur → Étagère → Étage → Classeur → Dossier' },
  ],

  paths: {

    // =========================================================================
    // AUTH  — /api/auth/*
    // =========================================================================

    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupBody' } } },
        },
        responses: {
          201: { description: 'Compte créé avec succès' },
          400: { description: 'Données invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          200: {
            description: 'Connexion réussie — retourne le token JWT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          401: { description: 'Identifiants incorrects' },
        },
      },
    },

    '/api/auth/validate': {
      post: {
        tags: ['Auth'],
        summary: 'Valider un compte utilisateur',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', description: 'Token de validation reçu par e-mail' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Compte validé' },
          400: { description: 'Token invalide ou expiré' },
        },
      },
    },

    '/api/auth/profil': {
      post: {
        tags: ['Auth'],
        summary: 'Mettre à jour le profil (photo)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary', description: 'Photo de profil' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profil mis à jour' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/auth/edit': {
      post: {
        tags: ['Auth'],
        summary: 'Modifier les informations du compte',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  email:    { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Compte mis à jour' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/auth/init': {
      get: {
        tags: ['Auth'],
        summary: 'Initialiser la configuration de l\'application',
        responses: {
          200: { description: 'Configuration initiale retournée' },
        },
      },
    },

    '/api/auth/users': {
      get: {
        tags: ['Auth'],
        summary: 'Lister tous les utilisateurs',
        responses: {
          200: {
            description: 'Liste des utilisateurs',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
          },
        },
      },
    },

    '/api/auth/check': {
      post: {
        tags: ['Auth'],
        summary: 'Vérifier si un utilisateur existe',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Résultat de la vérification' },
        },
      },
    },

    // =========================================================================
    // ADMIN  — /admin/*
    // =========================================================================

    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Lister tous les utilisateurs',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste complète des utilisateurs',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
          },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé — rôle admin requis' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Créer un utilisateur',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupBody' } } },
        },
        responses: {
          201: { description: 'Utilisateur créé' },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Modifier un utilisateur',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  _id:      { type: 'string' },
                  username: { type: 'string' },
                  email:    { type: 'string', format: 'email' },
                  role:     { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Utilisateur modifié' },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
    },

    '/admin/users/{datas}': {
      get: {
        tags: ['Admin'],
        summary: 'Rechercher des utilisateurs par propriété',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'datas',
            in: 'path',
            required: true,
            description: 'Critère de recherche sérialisé',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Résultats de la recherche', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
    },

    '/admin/users/permissions': {
      put: {
        tags: ['Admin'],
        summary: 'Remplacer toutes les permissions d\'un utilisateur',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId:      { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Permissions mises à jour' },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
    },

    '/admin/users/permissions/{mode}': {
      put: {
        tags: ['Admin'],
        summary: 'Ajouter ou retirer une permission spécifique',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'mode',
            in: 'path',
            required: true,
            description: '`add` pour ajouter, `remove` pour retirer',
            schema: { type: 'string', enum: ['add', 'remove'] },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId:     { type: 'string' },
                  permission: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Permission modifiée' },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
    },

    '/admin/roles': {
      get: {
        tags: ['Admin'],
        summary: 'Lister tous les rôles',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Liste des rôles', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Créer un rôle',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name:        { type: 'string', example: 'moderator' },
                  permissions: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Rôle créé' },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
    },

    '/admin/{userId}': {
      get: {
        tags: ['Admin'],
        summary: 'Récupérer un utilisateur par son ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Utilisateur trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          404: { description: 'Utilisateur introuvable' },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès refusé' },
        },
      },
    },

    // =========================================================================
    // WORKSPACE  — /api/stuff/workspace/*
    // =========================================================================

    '/api/stuff/workspace/{data}': {
      get: {
        tags: ['Workspace'],
        summary: 'Lister les éléments du workspace',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'data',
            in: 'path',
            required: true,
            description: 'Filtre / identifiant du dossier ou type',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Liste des éléments du workspace' },
          401: { description: 'Non authentifié' },
        },
      },
      delete: {
        tags: ['Workspace'],
        summary: 'Supprimer un élément du workspace',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'data',
            in: 'path',
            required: true,
            description: 'Identifiant de l\'élément à supprimer',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Élément supprimé' },
          401: { description: 'Non authentifié' },
          404: { description: 'Introuvable' },
        },
      },
    },

    '/api/stuff/workspace': {
      post: {
        tags: ['Workspace'],
        summary: 'Créer un élément dans le workspace (upload fichier)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Élément créé' },
          401: { description: 'Non authentifié' },
        },
      },
      put: {
        tags: ['Workspace'],
        summary: 'Modifier un élément du workspace',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  _id:  { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Élément modifié' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    // =========================================================================
    // ARCHIVES  — /api/stuff/archives/*
    // =========================================================================

    '/api/stuff/archives/archived': {
      get: {
        tags: ['Archives'],
        summary: 'Lister les archives validées',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Archives validées',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Archive' } } } },
          },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/stuff/archives/{role}': {
      get: {
        tags: ['Archives'],
        summary: 'Lister les archives selon le rôle',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'role',
            in: 'path',
            required: true,
            description: 'Rôle ou catégorie pour filtrer les archives',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Liste des archives',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Archive' } } } },
          },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/stuff/archives': {
      post: {
        tags: ['Archives'],
        summary: 'Déposer une nouvelle archive',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file:  { type: 'string', format: 'binary' },
                  title: { type: 'string' },
                  role:  { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Archive créée' },
          400: { description: 'Données invalides' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    // ── Invalides ─────────────────────────────────────────────────────────────

    '/api/stuff/archives/invalid': {
      get: {
        tags: ['Invalides'],
        summary: 'Lister les archives invalides',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Liste des archives invalides', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Archive' } } } } },
          401: { description: 'Non authentifié' },
        },
      },
      post: {
        tags: ['Invalides'],
        summary: 'Marquer une archive comme invalide',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['archiveId'],
                properties: {
                  archiveId: { type: 'string' },
                  reason:    { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Archive marquée invalide' },
          400: { description: 'Données invalides' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/stuff/archives/invalid/{id}': {
      delete: {
        tags: ['Invalides'],
        summary: 'Supprimer une archive invalide',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Archive invalide supprimée' },
          401: { description: 'Non authentifié' },
          404: { description: 'Introuvable' },
        },
      },
    },

    // ── Événements ────────────────────────────────────────────────────────────

    '/api/stuff/archives/event': {
      get: {
        tags: ['Événements'],
        summary: 'Lister tous les événements',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Liste des événements', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
          401: { description: 'Non authentifié' },
        },
      },
      post: {
        tags: ['Événements'],
        summary: 'Créer un événement',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title:       { type: 'string' },
                  description: { type: 'string' },
                  date:        { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Événement créé' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/stuff/archives/event/{role}': {
      get: {
        tags: ['Événements'],
        summary: 'Lister les événements d\'un rôle',
        parameters: [
          {
            name: 'role',
            in: 'path',
            required: true,
            description: 'Rôle pour filtrer les événements',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Événements du rôle' },
        },
      },
    },

    '/api/stuff/archives/event/{id}': {
      delete: {
        tags: ['Événements'],
        summary: 'Supprimer un événement',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Événement supprimé' },
          401: { description: 'Non authentifié' },
          404: { description: 'Introuvable' },
        },
      },
    },

    // ── Validation ────────────────────────────────────────────────────────────

    '/api/stuff/validate': {
      get: {
        tags: ['Validation'],
        summary: 'Lister les archives en attente de validation',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Archives à valider', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Archive' } } } } },
          401: { description: 'Non authentifié' },
        },
      },
      post: {
        tags: ['Validation'],
        summary: 'Valider ou rejeter une archive',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['archiveId', 'action'],
                properties: {
                  archiveId: { type: 'string' },
                  action:    { type: 'string', enum: ['approve', 'reject'] },
                  comment:   { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Action de validation effectuée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    // =========================================================================
    // BIBLIOTHÈQUE  — /api/stuff/bibliotheque/*
    // =========================================================================

    '/api/stuff/bibliotheque': {
      get: {
        tags: ['Bibliothèque'],
        summary: 'Lister tous les livres',
        responses: {
          200: {
            description: 'Liste des livres',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Book' } } } },
          },
        },
      },
      post: {
        tags: ['Bibliothèque'],
        summary: 'Ajouter un livre',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title:  { type: 'string' },
                  author: { type: 'string' },
                  type:   { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Livre ajouté' },
        },
      },
    },

    '/api/stuff/bibliotheque/types': {
      get: {
        tags: ['Bibliothèque'],
        summary: 'Lister les types de livres disponibles',
        responses: {
          200: { description: 'Types de livres' },
        },
      },
    },

    '/api/stuff/bibliotheque/{id}': {
      get: {
        tags: ['Bibliothèque'],
        summary: 'Récupérer un livre par son ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Livre trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } } },
          404: { description: 'Introuvable' },
        },
      },
    },

    // =========================================================================
    // FILMOTHÈQUE  — /api/stuff/filmotheque/*
    // =========================================================================

    '/api/stuff/filmotheque': {
      get: {
        tags: ['Filmothèque'],
        summary: 'Lister tous les films',
        responses: {
          200: {
            description: 'Liste des films',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Film' } } } },
          },
        },
      },
      post: {
        tags: ['Filmothèque'],
        summary: 'Ajouter un film',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title:    { type: 'string' },
                  director: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Film ajouté' },
        },
      },
      put: {
        tags: ['Filmothèque'],
        summary: 'Modifier un film (avec fichier optionnel)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  _id:      { type: 'string' },
                  title:    { type: 'string' },
                  director: { type: 'string' },
                  cover:    { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Film modifié' },
        },
      },
      delete: {
        tags: ['Filmothèque'],
        summary: 'Supprimer tous les films',
        responses: {
          200: { description: 'Films supprimés' },
        },
      },
    },

    '/api/stuff/filmotheque/{id}': {
      get: {
        tags: ['Filmothèque'],
        summary: 'Récupérer un film par son ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Film trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Film' } } } },
          404: { description: 'Introuvable' },
        },
      },
      delete: {
        tags: ['Filmothèque'],
        summary: 'Supprimer un film',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Film supprimé' },
          404: { description: 'Introuvable' },
        },
      },
    },

    // =========================================================================
    // PHOTOTHÈQUE  — /api/stuff/phototheque/*
    // =========================================================================

    '/api/stuff/phototheque': {
      get: {
        tags: ['Photothèque'],
        summary: 'Lister toutes les images',
        responses: {
          200: {
            description: 'Liste des images',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Image' } } } },
          },
        },
      },
      post: {
        tags: ['Photothèque'],
        summary: 'Ajouter une image',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url:  { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Image ajoutée' },
        },
      },
      delete: {
        tags: ['Photothèque'],
        summary: 'Supprimer toutes les images',
        responses: {
          200: { description: 'Images supprimées' },
        },
      },
    },

    '/api/stuff/phototheque/{id}': {
      get: {
        tags: ['Photothèque'],
        summary: 'Récupérer une image par son ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Image trouvée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Image' } } } },
          404: { description: 'Introuvable' },
        },
      },
      put: {
        tags: ['Photothèque'],
        summary: 'Modifier une image (upload)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary' },
                  name:  { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Image modifiée' },
          404: { description: 'Introuvable' },
        },
      },
      delete: {
        tags: ['Photothèque'],
        summary: 'Supprimer une image',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Image supprimée' },
          404: { description: 'Introuvable' },
        },
      },
    },

    // =========================================================================
    // FROZEN (FAVORIS)  — /api/stuff/frozen/*
    // =========================================================================

    '/api/stuff/frozen/{datas}': {
      get: {
        tags: ['Favoris'],
        summary: 'Lister les éléments gelés / favoris',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'datas',
            in: 'path',
            required: true,
            description: 'Filtre (ex. type d\'élément)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Liste des favoris' },
          401: { description: 'Non authentifié' },
        },
      },
      delete: {
        tags: ['Favoris'],
        summary: 'Supprimer un favori',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'datas',
            in: 'path',
            required: true,
            description: 'Identifiant ou filtre de l\'élément à retirer',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Favori retiré' },
          401: { description: 'Non authentifié' },
          404: { description: 'Introuvable' },
        },
      },
    },

    '/api/stuff/frozen': {
      post: {
        tags: ['Favoris'],
        summary: 'Ajouter un élément aux favoris',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemId', 'itemType'],
                properties: {
                  itemId:   { type: 'string' },
                  itemType: { type: 'string', example: 'book' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Favori ajouté' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    // =========================================================================
    // COUVERTURES  — /api/stuff/cover/*
    // =========================================================================

    '/api/stuff/cover': {
      get: {
        tags: ['Couvertures'],
        summary: 'Lister les couvertures disponibles',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Liste des couvertures' },
          401: { description: 'Non authentifié' },
        },
      },
      post: {
        tags: ['Couvertures'],
        summary: 'Uploader une nouvelle couverture',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary' },
                  name:  { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Couverture uploadée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/stuff/cover/set': {
      post: {
        tags: ['Couvertures'],
        summary: 'Associer une couverture à un élément',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemId', 'coverName'],
                properties: {
                  itemId:    { type: 'string' },
                  coverName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Couverture associée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/stuff/cover/{name}': {
      delete: {
        tags: ['Couvertures'],
        summary: 'Supprimer une couverture',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            description: 'Nom du fichier de couverture',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Couverture supprimée' },
          401: { description: 'Non authentifié' },
          404: { description: 'Introuvable' },
        },
      },
    },

    // =========================================================================
    // CHAT  — /api/chat/*
    // =========================================================================

    '/api/chat': {
      get: {
        tags: ['Chat'],
        summary: 'Lister toutes les conversations',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Liste des conversations' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/call/create': {
      post: {
        tags: ['Chat'],
        summary: 'Créer une session d\'appel',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roomId: { type: 'string' },
                  type:   { type: 'string', example: 'video' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Session d\'appel créée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/guest/create': {
      post: {
        tags: ['Chat'],
        summary: 'Créer un accès invité pour rejoindre un appel',
        description: 'Route publique — ne nécessite pas de token JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roomId: { type: 'string' },
                  name:   { type: 'string', example: 'Invité' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Accès invité créé', content: { 'application/json': { schema: { type: 'object', properties: { guestToken: { type: 'string' } } } } } },
        },
      },
    },

    '/api/chat/direct': {
      post: {
        tags: ['Chat'],
        summary: 'Envoyer un fichier en message direct',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file:       { type: 'string', format: 'binary' },
                  recipientId:{ type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Fichier envoyé' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/file': {
      post: {
        tags: ['Chat'],
        summary: 'Envoyer un fichier dans une salle',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file:   { type: 'string', format: 'binary' },
                  roomId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Fichier envoyé dans la salle' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/invite': {
      post: {
        tags: ['Chat'],
        summary: 'Envoyer une invitation',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetId'],
                properties: {
                  targetId: { type: 'string' },
                  roomId:   { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Invitation envoyée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/reject': {
      post: {
        tags: ['Chat'],
        summary: 'Rejeter une invitation',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['inviteId'],
                properties: {
                  inviteId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Invitation rejetée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/accept': {
      post: {
        tags: ['Chat'],
        summary: 'Accepter une invitation',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['inviteId'],
                properties: {
                  inviteId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Invitation acceptée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/invites': {
      get: {
        tags: ['Chat'],
        summary: 'Lister les invitations reçues',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Liste des invitations' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/room/call': {
      post: {
        tags: ['Chat'],
        summary: 'Créer une salle d\'appel RTC',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', example: 'video' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Salle d\'appel créée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          401: { description: 'Non authentifié' },
        },
      },
      get: {
        tags: ['Chat'],
        summary: 'Lister les détails de tous les appels',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Liste des appels' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/room/call/register': {
      post: {
        tags: ['Chat'],
        summary: 'Enregistrer un participant dans une salle d\'appel',
        description: 'Route publique — utilisée pour les invités.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roomId: { type: 'string' },
                  userId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Participant enregistré' },
        },
      },
    },

    '/api/chat/room/call/{id}': {
      get: {
        tags: ['Chat'],
        summary: 'Récupérer les détails d\'un appel',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identifiant de la session d\'appel',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Détails de l\'appel' },
          401: { description: 'Non authentifié' },
          404: { description: 'Introuvable' },
        },
      },
    },

    '/api/chat/room/new': {
      post: {
        tags: ['Chat'],
        summary: 'Créer une nouvelle salle de chat',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name:         { type: 'string' },
                  participants: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Salle créée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/room/edit': {
      put: {
        tags: ['Chat'],
        summary: 'Modifier une salle de chat',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['_id'],
                properties: {
                  _id:  { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Salle modifiée' },
          401: { description: 'Non authentifié' },
        },
      },
    },

    '/api/chat/rtc/{type}/{target}/{role}/{tokenType}': {
      get: {
        tags: ['Chat'],
        summary: 'Obtenir un token RTC (Agora)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'path',
            required: true,
            description: 'Type de token (ex. `rtc`, `rtm`)',
            schema: { type: 'string', example: 'rtc' },
          },
          {
            name: 'target',
            in: 'path',
            required: true,
            description: 'Canal ou utilisateur cible',
            schema: { type: 'string' },
          },
          {
            name: 'role',
            in: 'path',
            required: true,
            description: 'Rôle dans l\'appel (`publisher` ou `subscriber`)',
            schema: { type: 'string', enum: ['publisher', 'subscriber'] },
          },
          {
            name: 'tokenType',
            in: 'path',
            required: true,
            description: 'Type de token Agora',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Token RTC retourné', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } },
          401: { description: 'Non authentifié' },
        },
      },
    },

    // =========================================================================
    // ARCHIVAGE PHYSIQUE  — /api/stuff/archives/physical/*
    //
    // Toutes ces routes sont protégées par JWT (middleware `auth` appliqué
    // en amont dans stuff.js). Elles gèrent la hiérarchie physique complète :
    //
    //   Conteneur → Étagère → Étage → Classeur → Dossier → Archive
    //
    // Règles métier clés :
    //   • Nature  : un dossier ne peut être placé que dans un classeur de même nature.
    //   • Capacité: l'ajout est refusé si le classeur a atteint sa capacité maximale.
    //   • QR code : généré automatiquement (UUID v4) à la création du dossier.
    //   • Intégrité : un classeur non vide ne peut pas être supprimé.
    // =========================================================================

    // ── Conteneurs ────────────────────────────────────────────────────────────
    // Niveau racine de la hiérarchie. Un conteneur regroupe plusieurs étagères.

    '/api/stuff/archives/physical/containers': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister tous les conteneurs',
        description:
          'Retourne l\'ensemble des conteneurs de la base. ' +
          'Utilisé pour alimenter les sélecteurs lors de la création d\'étagères ' +
          'ou pour afficher la vue d\'ensemble de l\'organisation physique.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste complète des conteneurs.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Container' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
          500: { description: 'Erreur interne du serveur.' },
        },
      },
      post: {
        tags: ['Archivage Physique'],
        summary: 'Créer un conteneur',
        description:
          'Crée un nouveau conteneur (niveau racine). ' +
          'Le champ `name` est automatiquement converti en majuscules et doit être unique.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ContainerBody' } } },
        },
        responses: {
          201: {
            description: 'Conteneur créé avec succès.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Container' } } },
          },
          400: { description: 'Données invalides — champ obligatoire manquant ou nom déjà existant.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/containers/{id}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Récupérer un conteneur par son identifiant',
        description: 'Retourne le détail complet d\'un conteneur identifié par son _id MongoDB.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du conteneur (ObjectId).',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        }],
        responses: {
          200: {
            description: 'Conteneur trouvé.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Container' } } },
          },
          404: { description: 'Aucun conteneur ne correspond à cet identifiant.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      put: {
        tags: ['Archivage Physique'],
        summary: 'Modifier un conteneur',
        description:
          'Met à jour les champs d\'un conteneur existant (mise à jour partielle possible). ' +
          'Les contraintes du schéma (unicité du nom, etc.) sont réévaluées.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du conteneur à modifier.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ContainerBody' } } },
        },
        responses: {
          200: {
            description: 'Conteneur mis à jour.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Container' } } },
          },
          400: { description: 'Données invalides.' },
          404: { description: 'Conteneur introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      delete: {
        tags: ['Archivage Physique'],
        summary: 'Supprimer un conteneur',
        description:
          'Supprime un conteneur de la base. ' +
          'Attention : vérifier au préalable que le conteneur ne contient plus d\'étagères ' +
          'pour éviter des références orphelines.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du conteneur à supprimer.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        }],
        responses: {
          200: {
            description: 'Conteneur supprimé.',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Conteneur supprimé' } } } } },
          },
          404: { description: 'Conteneur introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    // ── Étagères ──────────────────────────────────────────────────────────────
    // Niveau 2. Une étagère appartient à un conteneur et regroupe des étages.

    '/api/stuff/archives/physical/shelves': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister toutes les étagères',
        description:
          'Retourne l\'ensemble des étagères. ' +
          'Le champ `container` est peuplé automatiquement (_id, name, location).',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste complète des étagères avec conteneur peuplé.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Shelf' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
          500: { description: 'Erreur interne du serveur.' },
        },
      },
      post: {
        tags: ['Archivage Physique'],
        summary: 'Créer une étagère',
        description:
          'Crée une nouvelle étagère rattachée à un conteneur existant. ' +
          'Le champ `container` doit être un _id MongoDB valide d\'un conteneur existant.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ShelfBody' } } },
        },
        responses: {
          201: {
            description: 'Étagère créée.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Shelf' } } },
          },
          400: { description: 'Données invalides — champ manquant ou _id de conteneur invalide.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/shelves/container/{containerId}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister les étagères d\'un conteneur',
        description:
          'Retourne toutes les étagères appartenant au conteneur spécifié. ' +
          'Utile pour construire la vue détaillée d\'un conteneur.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'containerId', in: 'path', required: true,
          description: '_id MongoDB du conteneur parent.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        }],
        responses: {
          200: {
            description: 'Liste des étagères du conteneur.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Shelf' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/shelves/{id}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Récupérer une étagère par son identifiant',
        description: 'Retourne le détail d\'une étagère avec son conteneur parent peuplé.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB de l\'étagère.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e2' },
        }],
        responses: {
          200: {
            description: 'Étagère trouvée.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Shelf' } } },
          },
          404: { description: 'Étagère introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      put: {
        tags: ['Archivage Physique'],
        summary: 'Modifier une étagère',
        description: 'Met à jour les champs d\'une étagère existante (mise à jour partielle possible).',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB de l\'étagère à modifier.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e2' },
        }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ShelfBody' } } },
        },
        responses: {
          200: {
            description: 'Étagère mise à jour.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Shelf' } } },
          },
          400: { description: 'Données invalides.' },
          404: { description: 'Étagère introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      delete: {
        tags: ['Archivage Physique'],
        summary: 'Supprimer une étagère',
        description: 'Supprime une étagère. Vérifier au préalable qu\'elle ne contient plus d\'étages.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB de l\'étagère à supprimer.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e2' },
        }],
        responses: {
          200: {
            description: 'Étagère supprimée.',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Étagère supprimée' } } } } },
          },
          404: { description: 'Étagère introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    // ── Étages ────────────────────────────────────────────────────────────────
    // Niveau 3. Double rattachement : étagère (physique) + unité administrative.

    '/api/stuff/archives/physical/floors': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister tous les étages',
        description:
          'Retourne tous les étages. ' +
          'Les champs `shelf` (étagère parente) et `administrativeUnit` (rôle/direction) ' +
          'sont peuplés automatiquement.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste complète des étages.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Floor' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
          500: { description: 'Erreur interne du serveur.' },
        },
      },
      post: {
        tags: ['Archivage Physique'],
        summary: 'Créer un étage',
        description:
          'Crée un nouvel étage rattaché à une étagère et à une unité administrative. ' +
          'Les champs `shelf` et `administrativeUnit` doivent être des _id MongoDB valides.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FloorBody' } } },
        },
        responses: {
          201: {
            description: 'Étage créé.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Floor' } } },
          },
          400: { description: 'Données invalides — champ manquant ou _id invalide.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/floors/shelf/{shelfId}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister les étages d\'une étagère',
        description:
          'Retourne tous les étages d\'une étagère donnée, avec leur unité administrative respective. ' +
          'Utile pour connaître les services qui utilisent chaque niveau d\'une étagère.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'shelfId', in: 'path', required: true,
          description: '_id MongoDB de l\'étagère parente.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e2' },
        }],
        responses: {
          200: {
            description: 'Liste des étages de l\'étagère.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Floor' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/floors/{id}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Récupérer un étage par son identifiant',
        description: 'Retourne le détail d\'un étage avec étagère et unité administrative peuplés.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB de l\'étage.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e3' },
        }],
        responses: {
          200: {
            description: 'Étage trouvé.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Floor' } } },
          },
          404: { description: 'Étage introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      put: {
        tags: ['Archivage Physique'],
        summary: 'Modifier un étage',
        description: 'Met à jour les champs d\'un étage existant (mise à jour partielle possible).',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB de l\'étage à modifier.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e3' },
        }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FloorBody' } } },
        },
        responses: {
          200: {
            description: 'Étage mis à jour.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Floor' } } },
          },
          400: { description: 'Données invalides.' },
          404: { description: 'Étage introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      delete: {
        tags: ['Archivage Physique'],
        summary: 'Supprimer un étage',
        description: 'Supprime un étage. Vérifier au préalable qu\'il ne contient plus de classeurs.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB de l\'étage à supprimer.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e3' },
        }],
        responses: {
          200: {
            description: 'Étage supprimé.',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Étage supprimé' } } } } },
          },
          404: { description: 'Étage introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    // ── Classeurs ─────────────────────────────────────────────────────────────
    // Niveau 4. Entité régulatrice : impose une nature et une capacité maximale.

    '/api/stuff/archives/physical/binders': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister tous les classeurs',
        description:
          'Retourne tous les classeurs. ' +
          'Le champ `floor` est peuplé avec _id, number et label de l\'étage parent.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste complète des classeurs.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Binder' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
          500: { description: 'Erreur interne du serveur.' },
        },
      },
      post: {
        tags: ['Archivage Physique'],
        summary: 'Créer un classeur',
        description:
          'Crée un nouveau classeur sur un étage existant. ' +
          '`nature` et `name` sont convertis en majuscules. ' +
          '`maxCapacity` (minimum 1) définit le plafond d\'accueil des dossiers.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BinderBody' } } },
        },
        responses: {
          201: {
            description: 'Classeur créé.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Binder' } } },
          },
          400: { description: 'Données invalides — champ manquant, capacité < 1, ou _id invalide.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/binders/floor/{floorId}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister les classeurs d\'un étage',
        description:
          'Retourne tous les classeurs d\'un étage donné. ' +
          'Utile pour guider l\'utilisateur lors de l\'affectation d\'un dossier ' +
          '(visualiser les classeurs disponibles et leurs natures).',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'floorId', in: 'path', required: true,
          description: '_id MongoDB de l\'étage parent.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e3' },
        }],
        responses: {
          200: {
            description: 'Liste des classeurs de l\'étage.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Binder' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/binders/{id}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Récupérer un classeur avec son taux de remplissage',
        description:
          'Retourne le détail du classeur enrichi d\'un champ `currentCount` calculé dynamiquement. ' +
          '`currentCount` représente le nombre de dossiers actuellement présents, ' +
          'permettant à l\'interface d\'afficher une jauge : currentCount / maxCapacity.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du classeur.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e4' },
        }],
        responses: {
          200: {
            description: 'Classeur trouvé avec currentCount calculé.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Binder' } } },
          },
          404: { description: 'Classeur introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      put: {
        tags: ['Archivage Physique'],
        summary: 'Modifier un classeur',
        description:
          'Met à jour les champs d\'un classeur existant. ' +
          'Attention : modifier `nature` après que des dossiers sont déjà présents ' +
          'peut créer une incohérence. À valider côté client si nécessaire.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du classeur à modifier.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e4' },
        }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BinderBody' } } },
        },
        responses: {
          200: {
            description: 'Classeur mis à jour.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Binder' } } },
          },
          400: { description: 'Données invalides.' },
          404: { description: 'Classeur introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      delete: {
        tags: ['Archivage Physique'],
        summary: 'Supprimer un classeur',
        description:
          'Supprime un classeur uniquement s\'il est vide. ' +
          'Si au moins un dossier référence ce classeur, la suppression est refusée ' +
          'avec HTTP 409 pour préserver l\'intégrité référentielle.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du classeur à supprimer.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e4' },
        }],
        responses: {
          200: {
            description: 'Classeur supprimé.',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Classeur supprimé' } } } } },
          },
          404: { description: 'Classeur introuvable.' },
          409: {
            description: 'Suppression refusée — le classeur contient encore des dossiers.',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Impossible de supprimer ce classeur : il contient des dossiers' } } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    // ── Dossiers (records) ────────────────────────────────────────────────────
    // Niveau 5. Entité pivot. QR code généré automatiquement. Règles métier strictes.

    '/api/stuff/archives/physical/records': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister tous les dossiers',
        description:
          'Retourne tous les dossiers physiques. ' +
          'Les champs `binder` (nom, nature, étage) et `agent` (prénom, nom) ' +
          'sont peuplés automatiquement.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste complète des dossiers.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Record' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
          500: { description: 'Erreur interne du serveur.' },
        },
      },
      post: {
        tags: ['Archivage Physique'],
        summary: 'Créer un dossier physique',
        description:
          '**Règles métier appliquées avant création :**\n\n' +
          '1. **Existence du classeur** — HTTP 404 si le classeur cible est introuvable.\n' +
          '2. **Validation de la nature** — `record.nature` doit être identique à `binder.nature` ' +
          '(insensible à la casse). HTTP 422 si incompatible.\n' +
          '3. **Contrôle de capacité** — le nombre de dossiers existants doit être ' +
          '< `binder.maxCapacity`. HTTP 422 si le classeur est plein.\n\n' +
          '**Champs générés automatiquement :**\n' +
          '- `qrCode` : UUID v4 unique, généré par `crypto.randomUUID()`. ' +
          'Destiné à être imprimé sur le dossier physique.\n' +
          '- `agent` : utilisateur connecté (res.locals.userId), ne pas fournir dans le body.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordBody' } } },
        },
        responses: {
          201: {
            description: 'Dossier créé avec QR code généré.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Record' } } },
          },
          404: { description: 'Classeur cible introuvable.' },
          422: {
            description: 'Règle métier violée — nature incompatible ou classeur plein.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: 'La nature du dossier (\'FINANCE\') ne correspond pas à celle du classeur (\'RH\')' } },
                },
              },
            },
          },
          400: { description: 'Données invalides (validation du schéma).' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/records/binder/{binderId}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Lister les dossiers d\'un classeur',
        description:
          'Retourne tous les dossiers présents dans un classeur donné. ' +
          'Utile pour afficher le contenu d\'un classeur ou vérifier son état de remplissage.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'binderId', in: 'path', required: true,
          description: '_id MongoDB du classeur.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e4' },
        }],
        responses: {
          200: {
            description: 'Liste des dossiers du classeur.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Record' } } } },
          },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/records/qr/{qrCode}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Retrouver un dossier par QR code — lien physique-numérique',
        description:
          '**Point d\'entrée principal du lien physique-numérique.**\n\n' +
          'En scannant le QR code imprimé sur un dossier cartonné, l\'application ' +
          'appelle cet endpoint pour afficher instantanément la fiche numérique complète.\n\n' +
          'Retourne le dossier avec sa **chaîne hiérarchique entière peuplée** :\n' +
          'Dossier → Classeur → Étage → Étagère → Conteneur + Unité administrative.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'qrCode', in: 'path', required: true,
          description: 'UUID v4 du QR code imprimé sur le dossier physique. Exemple : "550e8400-e29b-41d4-a716-446655440000".',
          schema: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
        }],
        responses: {
          200: {
            description: 'Dossier trouvé avec toute la hiérarchie peuplée (Classeur → Étage → Étagère → Conteneur).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Record' } } },
          },
          404: { description: 'Aucun dossier ne correspond à ce QR code.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

    '/api/stuff/archives/physical/records/{id}': {
      get: {
        tags: ['Archivage Physique'],
        summary: 'Récupérer un dossier avec sa hiérarchie complète',
        description:
          'Retourne un dossier identifié par son _id MongoDB, enrichi de toute ' +
          'la chaîne de localisation physique peuplée :\n' +
          'Dossier → Classeur → Étage → { Étagère → Conteneur, Unité administrative }.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du dossier.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e5' },
        }],
        responses: {
          200: {
            description: 'Dossier trouvé avec hiérarchie complète.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Record' } } },
          },
          404: { description: 'Dossier introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      put: {
        tags: ['Archivage Physique'],
        summary: 'Modifier un dossier',
        description:
          'Met à jour un dossier existant. Si `binder` ou `nature` sont modifiés, ' +
          'les règles métier sont **re-validées** :\n\n' +
          '- **Nature** : la nouvelle nature doit correspondre à celle du classeur cible.\n' +
          '- **Capacité** : si le classeur change, le classeur de destination ' +
          'ne doit pas être plein.\n\n' +
          'Note : le `qrCode` ne peut pas être modifié après sa génération initiale.',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du dossier à modifier.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e5' },
        }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordBody' } } },
        },
        responses: {
          200: {
            description: 'Dossier mis à jour.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Record' } } },
          },
          404: { description: 'Dossier ou classeur introuvable.' },
          422: {
            description: 'Règle métier violée — nature incompatible ou classeur de destination plein.',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string', example: 'Le classeur de destination est plein (capacité maximale : 50)' } } },
              },
            },
          },
          400: { description: 'Données invalides.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
      delete: {
        tags: ['Archivage Physique'],
        summary: 'Supprimer un dossier',
        description:
          'Supprime un dossier physique de la base. ' +
          'Les archives numériques liées via le champ `record` (Archive model) ' +
          'conservent leur référence après la suppression (références orphelines possibles).',
        security: [{ BearerAuth: [] }],
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: '_id MongoDB du dossier à supprimer.',
          schema: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e5' },
        }],
        responses: {
          200: {
            description: 'Dossier supprimé.',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Dossier supprimé' } } } } },
          },
          404: { description: 'Dossier introuvable.' },
          401: { description: 'Token JWT absent ou invalide.' },
        },
      },
    },

  },
};

module.exports = swaggerSpec;
