'use strict';

/**
 * models/archives/dashboardPrefs.model.js
 *
 * Préférences utilisateur pour le tableau de bord GEID Archives.
 * Chaque utilisateur a un document unique (upsert par userId).
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const dashboardPrefsSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        ref: 'users',
    },

    /** 1. Sections visibles du tableau de bord */
    visibleWidgets: {
        type: [String],
        default: ['alerts', 'stats', 'recent', 'distribution', 'dua', 'binders', 'inventory', 'users', 'quickAccess'],
    },

    /** 2. Cartes de synthèse visibles (max 6, dans l'ordre d'affichage) */
    visibleStats: {
        type: [String],
        default: ['totalArchives', 'pending', 'active', 'semiActive', 'permanent', 'containers'],
    },

    /** 3. Type de chart pour la répartition par statut */
    chartType: {
        type: String,
        enum: ['pie', 'bar', 'donut', 'list'],
        default: 'donut',
    },

    /** 4. Nombre d'archives récentes à afficher */
    recentCount: {
        type: Number,
        min: 3,
        max: 20,
        default: 8,
    },

    /** 5. Seuils d'alertes personnalisés */
    alertThresholds: {
        duaDays: { type: Number, default: 30 },       // jours avant expiration DUA
        binderCapacity: { type: Number, default: 90 }, // % capacité classeur
    },

    /** 6. Rafraîchissement automatique (en secondes, 0 = désactivé) */
    autoRefreshSeconds: {
        type: Number,
        min: 0,
        max: 300,
        default: 0,
    },

    /** 7. Palette de couleurs des statuts */
    colorPalette: {
        type: String,
        enum: ['default', 'accessible', 'monochrome', 'warm', 'cool'],
        default: 'default',
    },

    /** 8. Unité administrative par défaut (filtre le dashboard) */
    defaultUnit: {
        type: String,
        default: '',  // vide = toutes les unités
    },

    /** 9. Notifications sonores */
    soundNotifications: {
        type: Boolean,
        default: false,
    },

    /** 10. Layout personnalisé — position et taille de chaque widget */
    customLayout: {
        type: Schema.Types.Mixed,
        default: null, // null = layout par défaut
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('dashboardPrefs', dashboardPrefsSchema);
