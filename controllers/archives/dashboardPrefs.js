'use strict';

/**
 * controllers/archives/dashboardPrefs.js
 *
 * GET  /api/stuff/archives/prefs/dashboard     — lire les préférences
 * PUT  /api/stuff/archives/prefs/dashboard     — sauvegarder les préférences
 * DELETE /api/stuff/archives/prefs/dashboard   — réinitialiser aux valeurs par défaut
 */

const DashboardPrefs = require('../../models/archives/dashboardPrefs.model');

exports.get = async (req, res) => {
    try {
        const userId = res.locals.userId;
        let prefs = await DashboardPrefs.findOne({ userId }).lean();
        if (!prefs) {
            // Créer les préférences par défaut
            prefs = await DashboardPrefs.create({ userId });
            prefs = prefs.toObject();
        }
        res.status(200).json(prefs);
    } catch (error) {
        console.error('[dashboardPrefs/get]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

exports.save = async (req, res) => {
    try {
        const userId = res.locals.userId;
        const allowedFields = [
            'visibleWidgets', 'widgetOrder', 'chartType', 'recentCount',
            'alertThresholds', 'autoRefreshSeconds', 'colorPalette',
            'defaultUnit', 'soundNotifications', 'customLayout',
        ];

        const update = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) update[field] = req.body[field];
        });

        const prefs = await DashboardPrefs.findOneAndUpdate(
            { userId },
            { $set: update },
            { new: true, upsert: true, runValidators: true }
        ).lean();

        res.status(200).json({ message: 'Préférences sauvegardées.', prefs });
    } catch (error) {
        console.error('[dashboardPrefs/save]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

exports.reset = async (req, res) => {
    try {
        const userId = res.locals.userId;
        await DashboardPrefs.deleteOne({ userId });
        const prefs = await DashboardPrefs.create({ userId });
        res.status(200).json({ message: 'Préférences réinitialisées.', prefs });
    } catch (error) {
        console.error('[dashboardPrefs/reset]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
