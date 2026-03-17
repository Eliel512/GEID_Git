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
    { name: 'Chat',         description: 'Messagerie, appels et salles de chat' },
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
  },
};

module.exports = swaggerSpec;
