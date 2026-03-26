/**
 * Middleware archives/postOne — Validation basique avant archivage.
 * Le folder est géré par le controller (auto-créé si absent).
 */
module.exports = (req, res, next) => {
    if (!req.body.doc) {
        return res.status(400).json({ message: 'Le champ "doc" (identifiant du fichier) est requis.' });
    }
    if (!req.body.designation) {
        return res.status(400).json({ message: 'Le champ "designation" est requis.' });
    }
    next();
};
