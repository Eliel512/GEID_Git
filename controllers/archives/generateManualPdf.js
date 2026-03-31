/**
 * generateManualPdf — Génère le manuel utilisateur GEID Archives en PDF côté serveur.
 *
 * Utilisé comme fallback si le navigateur du client ne peut pas exécuter
 * @react-pdf/renderer (navigateurs très anciens, mémoire insuffisante, etc.).
 *
 * GET /api/stuff/archives/manual/pdf
 * Renvoie un fichier PDF en streaming (Content-Type: application/pdf).
 */

const PDFDocument = require("pdfkit");
const path        = require("path");

const LOGO_PATH = path.join(__dirname, "../../assets/geid_logo_white.png");

const PRIMARY   = "#1565C0";
const DARK      = "#0D47A1";
const TEXT      = "#1A1A2E";
const SECONDARY = "#546E7A";
const LIGHT     = "#E8F0FE";
const WARNING   = "#F59E0B";
const ERROR     = "#C62828";
const SUCCESS   = "#2E7D32";
const BORDER    = "#CFD8DC";

const PAGE_W    = 595.28; // A4 width  (pt)
const PAGE_H    = 841.89; // A4 height (pt)
const MARGIN_X  = 52;
const MARGIN_Y  = 48;
const TEXT_W    = PAGE_W - MARGIN_X * 2;

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
module.exports = async function generateManualPdf(req, res) {
  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="GEID_Archives_Manuel_${new Date().toISOString().slice(0, 10)}.pdf"`
    );

    const doc = new PDFDocument({
      size:   "A4",
      margin: 0,
      info: {
        Title:   "GEID Archives — Manuel Utilisateur",
        Author:  "GEID Archives",
        Subject: "Guide complet de gestion documentaire",
      },
    });

    doc.pipe(res);

    // ── Helpers ──────────────────────────────────────────────────

    const addPageHeader = (section) => {
      doc
        .save()
        .rect(MARGIN_X, MARGIN_Y, TEXT_W, 1).fillColor(PRIMARY).fill()
        .fontSize(8).fillColor(PRIMARY).font("Helvetica-Bold")
        .text("GEID ARCHIVES", MARGIN_X, MARGIN_Y + 6, { continued: true })
        .fillColor(SECONDARY).font("Helvetica")
        .text(`  —  ${section}`, { align: "left" })
        .restore();
    };

    const addPageFooter = () => {
      const y = PAGE_H - 30;
      doc
        .save()
        .rect(MARGIN_X, y, TEXT_W, 0.5).fillColor(BORDER).fill()
        .fontSize(7).fillColor(SECONDARY).font("Helvetica")
        .text(`Manuel utilisateur — Usage interne — ${new Date().getFullYear()}`, MARGIN_X, y + 5)
        .text(`Page ${doc.bufferedPageRange().count}`, MARGIN_X, y + 5, { align: "right", width: TEXT_W })
        .restore();
    };

    const h = (level, text, y) => {
      const sizes = { 1: 22, 2: 14, 3: 11.5, 4: 10.5 };
      const colors = { 1: DARK, 2: DARK, 3: TEXT, 4: PRIMARY };
      const fonts  = { 1: "Helvetica-Bold", 2: "Helvetica-Bold", 3: "Helvetica-Bold", 4: "Helvetica-Bold" };
      if (y !== undefined && y > PAGE_H - 100) { doc.addPage(); return addPageHeader("Suite"); }
      doc.fontSize(sizes[level]).fillColor(colors[level]).font(fonts[level]).text(text, MARGIN_X, y ?? doc.y + 10);
      if (level === 2) {
        doc.rect(MARGIN_X, doc.y + 2, TEXT_W, 0.5).fillColor(PRIMARY).fill();
        doc.y += 4;
      }
      return doc.y;
    };

    const p = (text) => {
      doc.fontSize(10).fillColor(TEXT).font("Helvetica")
        .text(text, MARGIN_X, doc.y + 4, { width: TEXT_W, align: "justify", lineGap: 3 });
      doc.y += 4;
    };

    const bullet = (text) => {
      doc.fontSize(10).fillColor(TEXT).font("Helvetica")
        .text("•  " + text, MARGIN_X + 8, doc.y + 3, { width: TEXT_W - 8, lineGap: 2 });
    };

    const step = (n, text) => {
      const y0 = doc.y + 4;
      doc.circle(MARGIN_X + 8, y0 + 7, 7).fillColor(PRIMARY).fill();
      doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica-Bold")
        .text(String(n), MARGIN_X + 5, y0 + 3, { width: 10, align: "center" });
      doc.fontSize(10).fillColor(TEXT).font("Helvetica")
        .text(text, MARGIN_X + 22, y0, { width: TEXT_W - 22, lineGap: 2 });
      doc.y += 2;
    };

    const infoBox = (label, text, bg, borderColor, labelColor) => {
      const startY = doc.y + 6;
      const lines  = doc.heightOfString(text, { width: TEXT_W - 20 });
      const boxH   = lines + 30;
      doc.rect(MARGIN_X, startY, TEXT_W, boxH).fillColor(bg).fill();
      doc.rect(MARGIN_X, startY, 3, boxH).fillColor(borderColor).fill();
      doc.fontSize(7.5).fillColor(labelColor).font("Helvetica-Bold")
        .text(label, MARGIN_X + 10, startY + 8);
      doc.fontSize(9.5).fillColor(TEXT).font("Helvetica")
        .text(text, MARGIN_X + 10, startY + 20, { width: TEXT_W - 20, lineGap: 2 });
      doc.y = startY + boxH + 4;
    };

    const info    = (text) => infoBox("À NOTER",   text, LIGHT,      PRIMARY, PRIMARY);
    const warn    = (text) => infoBox("ATTENTION", text, "#FFF8E1",   WARNING, WARNING);
    const succ    = (text) => infoBox("CONSEIL",   text, "#E8F5E9",   SUCCESS, SUCCESS);

    const div = () => {
      doc.rect(MARGIN_X, doc.y + 8, TEXT_W, 0.5).fillColor(BORDER).fill();
      doc.y += 16;
    };

    const chapterHeader = (num, title) => {
      doc.addPage();
      addPageHeader(`Chapitre ${num}`);
      const startY = MARGIN_Y + 28;
      doc.rect(MARGIN_X - 2, startY, 3, 50).fillColor(PRIMARY).fill();
      doc.fontSize(9).fillColor(PRIMARY).font("Helvetica-Bold")
        .text(`CHAPITRE ${num}`, MARGIN_X + 8, startY);
      doc.fontSize(22).fillColor(DARK).font("Helvetica-Bold")
        .text(title, MARGIN_X + 8, startY + 14);
      doc.y = startY + 65;
    };

    // ── PAGE DE GARDE ────────────────────────────────────────────

    doc.rect(0, 0, PAGE_W, PAGE_H * 0.52).fillColor(DARK).fill();
    doc.rect(0, PAGE_H * 0.52, PAGE_W, PAGE_H * 0.32).fillColor(PRIMARY).fill();
    doc.rect(0, PAGE_H * 0.84, PAGE_W, PAGE_H * 0.16).fillColor("#0A2472").fill();

    // Logo (PNG transparent — blanc sur fond bleu)
    try { doc.image(LOGO_PATH, MARGIN_X, 42, { width: 155 }); } catch (_e) { /* fichier absent : on ignore */ }

    doc.fontSize(9).fillColor("#90CAF9").font("Helvetica-Bold")
      .text("GESTION ELECTRONIQUE DE L'INFORMATION ET DES DOCUMENTS", MARGIN_X, 118, { letterSpacing: 1 });
    doc.fontSize(38).fillColor("#FFFFFF").font("Helvetica-Bold")
      .text("Manuel\nUtilisateur", MARGIN_X, 140, { lineGap: 4 });
    doc.fontSize(16).fillColor("#BBDEFB").font("Helvetica")
      .text("GEID | Archives", MARGIN_X, 248);
    doc.fontSize(11).fillColor("#90CAF9")
      .text("Guide complet de la gestion des archives numériques et physiques.\nDe la soumission jusqu'à la conservation définitive.", MARGIN_X, 278, { width: TEXT_W, lineGap: 3 });

    const midY = PAGE_H * 0.52 + 20;
    doc.fontSize(9).fillColor("#BBDEFB").font("Helvetica")
      .text("Ce manuel est destiné à :", MARGIN_X, midY);
    const tags = ["Agents soumetteurs", "Archivistes", "Administrateurs"];
    let tagX = MARGIN_X;
    tags.forEach(t => {
      const tw = doc.widthOfString(t) + 16;
      doc.rect(tagX, midY + 14, tw, 18).fillColor("#1976D2").fill();
      doc.fontSize(8.5).fillColor("#E3F2FD").font("Helvetica-Bold").text(t, tagX + 8, midY + 19);
      tagX += tw + 8;
    });

    const botY = PAGE_H * 0.84 + 18;
    doc.fontSize(9).fillColor("#90CAF9").font("Helvetica")
      .text("Date de révision", MARGIN_X, botY);
    doc.fontSize(12).fillColor("#E3F2FD").font("Helvetica-Bold")
      .text(new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }), MARGIN_X, botY + 12);
    doc.fontSize(9).fillColor("#90CAF9").font("Helvetica")
      .text("Application", MARGIN_X, botY + 30);
    doc.fontSize(10).fillColor("#64B5F6").font("Helvetica")
      .text("geidbudget.com/apps/archives", MARGIN_X, botY + 42, { link: "https://geidbudget.com/apps/archives", underline: true });
    doc.fontSize(9).fillColor("#90CAF9").font("Helvetica")
      .text("geidbudget.com", MARGIN_X, botY + 56, { link: "https://geidbudget.com", underline: false });
    doc.fontSize(9).fillColor("#90CAF9").font("Helvetica")
      .text("Version", PAGE_W - 120, botY, { width: 60, align: "right" });
    doc.fontSize(22).fillColor("#E3F2FD").font("Helvetica-Bold")
      .text("v1.0.0", PAGE_W - 120, botY + 8, { width: 60, align: "right" });

    // ── CHAPITRE 1 ───────────────────────────────────────────────
    chapterHeader("1", "Présentation générale");
    h(2, "1.1 — Qu'est-ce que GEID Archives ?");
    p("GEID Archives est une application web de gestion électronique des documents d'archives. Elle centralise les archives numériques et physiques de l'organisation, assure la traçabilité complète du cycle de vie documentaire et garantit la conformité aux obligations légales de conservation.");
    p("L'application traite simultanément deux dimensions complémentaires : la dimension numérique (fichiers électroniques, métadonnées, cycle de vie) et la dimension physique (espaces de stockage réels, classeurs, documents papier). Le lien entre ces deux dimensions est assuré par le mécanisme de rattachement.");
    h(2, "1.2 — Objectifs et bénéfices");
    h(4, "Centralisation et organisation");
    p("GEID Archives crée un référentiel unique et structuré pour tous les documents de l'organisation, mettant fin à la dispersion entre postes de travail, serveurs partagés et messageries.");
    h(4, "Traçabilité et conformité réglementaire");
    p("Chaque action est enregistrée avec la date et l'auteur. La gestion intégrée des DUA assure le respect automatique des durées de conservation obligatoires. L'audit trail complet constitue une preuve opposable.");
    h(4, "Productivité et gain de temps");
    p("La recherche globale indexée retrouve n'importe quel document en quelques secondes. Les filtres avancés, les raccourcis clavier et les tableaux de bord synthétiques réduisent le temps consacré aux tâches administratives.");
    info("Toutes les communications entre le navigateur et le serveur sont chiffrées. L'authentification repose sur un jeton sécurisé (JWT). Aucune donnée sensible n'est stockée dans le navigateur au-delà de la session.");
    addPageFooter();

    // ── CHAPITRE 2 ───────────────────────────────────────────────
    chapterHeader("2", "Premiers pas — Connexion et interface");
    h(2, "2.1 — Configuration requise");
    bullet("Navigateur web récent : Chrome 90+, Firefox 88+, Edge 90+, Safari 14+");
    bullet("Connexion internet ou intranet stable");
    bullet("Résolution d'écran recommandée : 1280 × 800 pixels minimum");
    bullet("JavaScript activé dans le navigateur");
    warn("Internet Explorer n'est pas pris en charge. Utilisez un navigateur moderne.");
    h(2, "2.2 — Connexion à l'application");
    p("Les comptes sont créés par les administrateurs. Saisissez votre e-mail et votre mot de passe sur la page d'accueil. Le mot de passe est sensible à la casse.");
    h(2, "2.3 — Structure de l'interface");
    h(4, "La barre d'en-tête");
    p("Toujours visible en haut de l'écran. Affiche le nom de l'application et les options de profil.");
    h(4, "Le menu de navigation gauche");
    p("Présent sur les écrans moyens et grands. Donne accès aux quatre sections : Tableau de bord, Archives, Archivage physique et Aide. Sur mobile, il devient une barre de navigation horizontale en bas de l'écran.");
    h(4, "La zone de contenu centrale");
    p("Occupe la majeure partie de l'écran. Son organisation varie selon la section sélectionnée.");
    h(4, "Les notifications");
    p("Messages colorés apparaissant après chaque action : vert (succès), orange (avertissement), rouge (erreur). Disparaissent automatiquement.");
    h(2, "2.4 — Expiration de la session");
    p("Votre session expire automatiquement après une période d'inactivité prolongée. Lorsque cela se produit, l'application détecte l'expiration et vous déconnecte proprement. Un message vous informe de la situation et vous invite à vous reconnecter pour reprendre votre travail.");
    info("Si vous êtes déconnecté de manière inattendue, reconnectez-vous simplement avec vos identifiants habituels. Les données non enregistrées avant l'expiration ne sont pas récupérables.");
    addPageFooter();

    // ── CHAPITRE 3 ───────────────────────────────────────────────
    chapterHeader("3", "Le tableau de bord");
    p("Le tableau de bord est votre point d'entrée quotidien. Il offre une vue synthétique et actionnable de l'état du fonds documentaire. Toutes les données sont recalculées en temps réel.");
    h(2, "3.1 — Les cartes statistiques");
    p("Six cartes cliquables en haut du tableau présentent les compteurs clés. Cliquer sur une carte navigue vers la section correspondante.");
    bullet("Total archives : nombre total de documents enregistrés, tous statuts confondus.");
    bullet("En attente : archives non encore validées. Mise en évidence si supérieur à zéro.");
    bullet("Actives : archives validées en cours d'utilisation.");
    bullet("Intermédiaires : archives en phase de conservation réglementaire.");
    bullet("Locaux physiques : espaces de conservation physiques enregistrés.");
    bullet("Documents physiques : fiches physiques représentant des dossiers réels.");
    h(2, "3.2 — Les alertes prioritaires");
    p("Des bandeaux d'alerte colorés apparaissent selon les situations détectées par le système.");
    bullet("Alerte orange — Archives en attente : action de validation requise.");
    bullet("Alerte rouge — DUA expirées : archives ayant dépassé leur durée de conservation.");
    bullet("Alerte orange — Classeurs saturés : classeurs à plus de 90 % de capacité.");
    info("Vérifiez les alertes en début de journée pour traiter les situations urgentes avant qu'elles ne deviennent problématiques.");
    h(2, "3.3 — L'activité récente et les graphiques");
    p("La liste d'activité affiche les huit derniers documents modifiés, triés par date décroissante. Le graphique de répartition montre la proportion de chaque statut. Les alertes DUA listent les documents dont l'échéance est proche.");
    h(2, "3.4 — Personnaliser le tableau de bord");
    p("Le tableau de bord est entièrement personnalisable pour s'adapter à vos besoins quotidiens. Depuis les paramètres du tableau de bord, vous pouvez configurer les éléments suivants.");
    bullet("Cartes de synthèse : choisissez jusqu'à six compteurs parmi les douze disponibles et réorganisez-les par glisser-déposer selon vos priorités.");
    bullet("Sections du tableau de bord : activez ou désactivez individuellement chaque bloc — alertes, activité récente, répartition par statut, conservation, classeurs, inventaire, utilisateurs et raccourcis.");
    bullet("Type de graphique : choisissez parmi donut, camembert, barres horizontales ou liste détaillée.");
    bullet("Seuils d'alerte personnalisables : définissez le nombre de jours avant expiration d'une DUA et le pourcentage de remplissage des classeurs déclenchant une alerte.");
    bullet("Profondeur de l'historique : réglez le nombre d'archives récentes affichées, de trois à vingt éléments.");
    succ("Le tableau de bord se met à jour en temps réel. Chaque modification est immédiatement reflétée dans les compteurs et les graphiques.");
    addPageFooter();

    // ── CHAPITRE 4 ───────────────────────────────────────────────
    chapterHeader("4", "Les archives numériques");
    p("Une archive numérique est tout document électronique à valeur probatoire ou devant être conservé pour des raisons légales, réglementaires ou opérationnelles.");
    h(2, "4.1 — La liste principale et les filtres");
    p("La section Archives affiche un tableau de toutes les archives accessibles. Les colonnes présentent : désignation, numéro de classe, statut, date de création et état de la DUA.");
    h(4, "Filtres par statut");
    bullet("Toutes, En attente, Actives, Intermédiaires, Historiques, Détruites");
    h(4, "Filtres rapides");
    bullet("DUA expirées : archives intermédiaires dont la DUA a dépassé son terme.");
    bullet("Ce mois : archives créées dans le mois civil en cours.");
    h(2, "4.2 — Formulaire de soumission");
    p("Cliquez sur Ajouter pour ouvrir le formulaire de création d'une nouvelle archive.");
    h(4, "Désignation (obligatoire)");
    p("Nom principal et officiel du document. Doit être précis, sans abréviations non explicitées. C'est le premier critère utilisé par le moteur de recherche.");
    h(4, "Type documentaire (obligatoire)");
    p("Type et sous-type classifiant la nature du document. Utilisé pour les statistiques et les règles de gestion.");
    h(4, "Numéro de référence (obligatoire)");
    p("Référence unique attribuée au document. Ce champ est obligatoire pour assurer la traçabilité.");
    h(4, "Numéro de classe");
    p("Code de classement selon le plan documentaire. Permet de regrouper les documents par famille.");
    h(4, "Dossier (automatique)");
    p("Le dossier de classement est déterminé automatiquement par le serveur à partir du type de document choisi. Vous n'avez pas besoin de le renseigner manuellement.");
    h(4, "Description");
    p("Résumé du contenu en quelques phrases. Améliore significativement la pertinence des recherches.");
    h(4, "Pièce jointe");
    p("Fichier numérique du document. Deux sources possibles : depuis votre appareil (glisser-déposer ou sélection) ou depuis votre espace personnel (fichiers déjà enregistrés dans votre espace de travail). Lorsque vous choisissez un fichier depuis votre espace personnel, la désignation et le type documentaire sont pré-remplis automatiquement.");
    succ("Avant de soumettre, relisez la désignation et la description. Ce sont les deux champs les plus consultés lors des recherches.");
    addPageFooter();

    // ── 4.3 — Lecteur de fichiers intégré ─────────────────────────
    h(2, "4.3 — Le lecteur de fichiers intégré");
    p("Double-cliquez sur une archive pour ouvrir son fichier dans le lecteur intégré. Le lecteur s'adapte automatiquement au type de fichier.");
    h(4, "Documents (PDF, Word, présentations)");
    p("Chaque page est affichée individuellement avec une barre de navigation en bas pour parcourir les pages, zoomer et rechercher dans le texte. Raccourcis clavier : flèches gauche/droite pour changer de page, +/- pour zoomer, Ctrl+F pour la recherche. Sur écran tactile, pincez à deux doigts pour zoomer.");
    h(4, "Images");
    p("Zoom à la molette ou au pincé tactile, glissement pour explorer les détails, rotation. Double-clic pour recentrer.");
    h(4, "Vidéos");
    p("Contrôles classiques, barre de progression avec aperçu au survol, vitesse réglable, mode image dans l'image et plein écran (double-clic). Sur tactile, glissez horizontalement pour avancer ou reculer.");
    h(4, "Fichiers audio");
    p("Lecteur avec visualisation animée, contrôles complets : lecture, pause, progression, volume et vitesse.");
    addPageFooter();

    // ── CHAPITRE 5 ───────────────────────────────────────────────
    chapterHeader("5", "Le cycle de vie documentaire");
    p("Le cycle de vie documentaire décrit le parcours complet d'un document depuis sa création jusqu'à sa destination finale. GEID Archives le formalise en cinq états identifiés par des couleurs.");
    h(2, "5.1 — En attente de validation");
    p("État initial de toute archive nouvellement soumise. Le document est visible mais pas encore traité par un archiviste. Durant cette phase, le déposant ne peut plus modifier le document.");
    h(2, "5.2 — Archive active");
    p("Document validé faisant partie du fonds courant. Accessible à tous les utilisateurs autorisés. État normal d'un document en cours d'utilisation opérationnelle.");
    h(2, "5.3 — Archive intermédiaire");
    p("Document dont l'usage courant est terminé mais dont la conservation reste obligatoire pendant la DUA. Accessible en cas de besoin légal ou de contentieux. C'est à ce stade que la DUA doit être configurée.");
    h(2, "5.4 — Archive historique");
    p("Conservation définitive. Le document a une valeur patrimoniale ou juridique permanente. Cet état est irréversible : aucune action de destruction n'est possible.");
    h(2, "5.5 — Archive détruite");
    p("Fin du cycle de vie. L'élimination est définitive et irréversible. Elle doit être effectuée uniquement après expiration de la DUA et confirmation du sort final élimination.");
    warn("La destruction est irréversible. Vérifiez que la DUA est expirée, que le sort final est l'élimination, et que le document ne fait pas l'objet d'un contentieux.");
    h(2, "5.6 — Élimination proposée");
    p("Lorsque la DUA d'une archive arrive à échéance et que le sort final configuré est « élimination », l'archive ne passe pas directement en état détruit. Elle transite d'abord vers un état intermédiaire appelé « Élimination proposée ». Ce mécanisme garantit qu'aucune archive n'est détruite automatiquement sans intervention humaine.");
    h(4, "Le procès-verbal d'élimination");
    p("Pour détruire les archives en élimination proposée, un procès-verbal d'élimination (PV) doit être rédigé et approuvé selon un circuit de validation rigoureux.");
    step(1, "Brouillon — Le PV est créé par un archiviste avec la liste des archives concernées et la justification de leur élimination.");
    step(2, "Visa du producteur — Le service producteur examine le PV et confirme que les archives peuvent être éliminées.");
    step(3, "Visa de la DANTIC — L'autorité compétente en gestion documentaire valide la conformité du PV.");
    step(4, "Approuvé — Le PV a reçu tous les visas nécessaires et est prêt à être exécuté.");
    step(5, "Exécuté — La destruction effective des archives est réalisée. Cette action est irréversible.");
    info("Tant que le PV n'est pas exécuté, les archives restent consultables et intactes. Il est possible de réactiver une archive en élimination proposée ou de la basculer en conservation définitive si un intérêt historique est identifié.");
    h(2, "5.7 — L'historique des transitions");
    p("Chaque changement d'état est enregistré avec la date, l'heure et l'identité de l'auteur. Cet audit trail est visible dans le panneau de détail et garantit la traçabilité complète.");
    addPageFooter();

    // ── CHAPITRE 6 ───────────────────────────────────────────────
    chapterHeader("6", "La Durée d'Utilité Administrative (DUA)");
    p("La DUA est la période légale ou réglementaire pendant laquelle une organisation est tenue de conserver un document avant de pouvoir décider de son sort final.");
    h(2, "6.1 — Configurer une DUA");
    step(1, "L'archive doit être en état Intermédiaire. Ouvrez son panneau de détail.");
    step(2, "Cliquez sur le bouton DUA dans la barre d'actions rapides.");
    step(3, "Saisissez la valeur numérique (ex. : 5 pour cinq unités).");
    step(4, "Choisissez l'unité : jours, mois ou années.");
    step(5, "Indiquez la date de départ (date de clôture du dossier, fin du contrat...).");
    step(6, "Choisissez le sort final : Conservation définitive ou Élimination.");
    step(7, "Cliquez sur Enregistrer. La date d'expiration est calculée et affichée.");
    h(2, "6.2 — Tableau des DUA courantes");
    bullet("Contrats et conventions : 10 ans — Conservation");
    bullet("Décisions administratives : 10 ans — Conservation");
    bullet("Rapports d'activité : 10 ans — Conservation");
    bullet("Documents comptables : 10 ans — Élimination");
    bullet("Correspondances officielles : 5 ans — Élimination");
    bullet("Dossiers du personnel : 50 ans — Conservation");
    bullet("Notes internes : 3 ans — Élimination");
    info("Ce tableau est indicatif. Les DUA réglementaires peuvent varier selon votre secteur d'activité. Consultez votre archiviste référent pour les durées applicables dans votre organisation.");
    addPageFooter();

    // ── CHAPITRE 7 ───────────────────────────────────────────────
    chapterHeader("7", "Validation et contrôle qualité");
    p("La validation certifie qu'une archive soumise est complète et conforme aux exigences documentaires. C'est une opération de contrôle qualité réservée aux archivistes et administrateurs.");
    h(2, "7.1 — Procédure de validation");
    step(1, "Accédez à la section Archives et filtrez par statut En attente.");
    step(2, "Cliquez sur l'archive à examiner pour ouvrir son panneau de détail.");
    step(3, "Lisez la désignation et la description. Vérifiez leur cohérence avec le contenu.");
    step(4, "Consultez le fichier joint pour vérifier sa conformité.");
    step(5, "Le dossier de classement est attribué automatiquement — vérifiez qu'il est cohérent.");
    step(6, "Cliquez sur Valider. Confirmez dans la fenêtre qui s'affiche.");
    h(2, "7.2 — Critères d'évaluation");
    bullet("La désignation identifie-t-elle clairement le document sans avoir à l'ouvrir ?");
    bullet("Le dossier de classement (attribué automatiquement) est-il cohérent avec le plan documentaire ?");
    bullet("Le fichier est-il lisible, complet et dans un format pérenne ?");
    bullet("Le contenu du fichier correspond-il à la désignation ?");
    succ("Établissez un délai maximal de traitement des archives en attente (5 jours ouvrables est un standard courant). Consultez quotidiennement le tableau de bord pour ne pas dépasser ce délai.");
    addPageFooter();

    // ── CHAPITRE 8 ───────────────────────────────────────────────
    chapterHeader("8", "Gestion et opérations sur les archives");
    h(2, "8.1 — Modifier les métadonnées");
    p("Ouvrez le panneau de détail et cliquez sur l'icône crayon. Le formulaire s'ouvre prérempli. Apportez vos modifications et sauvegardez.");
    info("La modification porte uniquement sur les métadonnées. Le fichier attaché ne peut pas être remplacé après validation pour préserver l'intégrité documentaire.");
    h(2, "8.2 — Supprimer une archive");
    p("Réservé aux administrateurs. Action irréversible effaçant l'archive, son fichier et toutes ses métadonnées.");
    h(4, "Suppression individuelle");
    step(1, "Ouvrez le panneau de détail. Cliquez sur l'icône corbeille.");
    step(2, "Lisez le message de confirmation. Cliquez sur Supprimer définitivement.");
    h(4, "Suppression en masse");
    step(1, "Cochez les archives à supprimer dans le tableau.");
    step(2, "Ouvrez le menu Actions. Choisissez Supprimer la sélection.");
    step(3, "Confirmez dans la fenêtre de confirmation.");
    warn("La suppression en masse est particulièrement risquée. Vérifiez scrupuleusement votre sélection avant de confirmer.");
    h(2, "8.3 — Exporter la liste en CSV");
    p("Cliquez sur l'icône de téléchargement dans la barre de navigation gauche. Le fichier CSV contient : Désignation, Numéro de classe, Référence, Dossier (automatique), Statut, Date. Les filtres actifs sont respectés dans l'export.");
    addPageFooter();

    // ── CHAPITRE 9 ───────────────────────────────────────────────
    chapterHeader("9", "L'archivage physique");
    p("L'archivage physique modélise et gère l'inventaire des espaces et supports de conservation réels. Il crée le lien entre le monde numérique et le monde matériel. L'interface adopte une disposition de type explorateur de fichiers avec fil d'Ariane, titre contextuel et ligne de retour (..).");
    h(2, "9.1 — La hiérarchie des espaces physiques (6 niveaux)");
    bullet("Conteneur : armoire, salle ou espace de conservation délimité. Niveau racine de la hiérarchie.");
    bullet("Étagère : rayon ou travée à l'intérieur d'un conteneur.");
    bullet("Niveau : étage ou compartiment de l'étagère, rattaché à une unité administrative.");
    bullet("Classeur : unité de rangement spécialisée par nature de document avec capacité maximale configurable.");
    bullet("Dossier physique : fiche représentant un dossier réel identifié par un code QR unique.");
    bullet("Document : subdivision du dossier pouvant contenir des archives numériques et/ou des sous-documents de manière récursive.");
    h(2, "9.2 — Les documents et sous-documents");
    p("Un dossier physique peut contenir un ou plusieurs documents. Chaque document peut lui-même contenir d'autres sous-documents et/ou des archives numériques. Cette structure récursive permet de modéliser des dossiers complexes avec plusieurs niveaux de classement internes. Dans l'explorateur, les documents et archives sont affichés dans une liste mixte.");
    h(2, "9.3 — Créer un élément physique");
    step(1, "Naviguez jusqu'au niveau parent dans la hiérarchie.");
    step(2, "Cliquez sur le bouton Ajouter en haut de la liste.");
    step(3, "Remplissez le formulaire et validez. Les champs de date utilisent un calendrier interactif au format JJ/MM/AAAA.");
    h(2, "9.4 — Rattacher une archive à un dossier ou un document");
    p("Une archive numérique peut être rattachée à un dossier physique OU à un document spécifique à l'intérieur de ce dossier.");
    step(1, "Ouvrez le panneau de détail de l'archive numérique.");
    step(2, "Cliquez sur Dossier physique dans la barre d'actions.");
    step(3, "Naviguez dans la hiérarchie en cascade jusqu'au dossier ou document souhaité.");
    step(4, "Cliquez sur l'élément pour le sélectionner. Utilisez la flèche pour explorer son contenu.");
    step(5, "Confirmez avec le bouton Rattacher. Le détachement est aussi possible depuis le même dialogue.");
    h(2, "9.5 — Le code QR");
    p("Chaque dossier physique reçoit automatiquement un code QR unique (UUID). Imprimez-le et collez-le sur la chemise physique. Scanner ce code retrouve instantanément la fiche complète avec toute la localisation hiérarchique.");
    h(2, "9.6 — Saisie des dates avec le calendrier");
    p("Tous les champs de date utilisent un sélecteur de date avec calendrier interactif en français (JJ/MM/AAAA). Les dates sont enregistrées au format international ISO pour garantir la cohérence.");
    succ("L'utilisation systématique des codes QR et du calendrier réduit considérablement les erreurs de saisie et de classement.");
    addPageFooter();

    // ── CHAPITRE 10 ──────────────────────────────────────────────
    chapterHeader("10", "Recherche et indexation");
    p("La recherche unifiée explore simultanément les archives numériques et les documents physiques. Elle est indexée côté serveur pour des résultats rapides même sur un fonds important.");
    h(2, "10.1 — Accéder à la recherche");
    bullet("Raccourci clavier Ctrl+K (Windows / Linux) ou Commande+K (Mac).");
    bullet("Clic sur l'icône loupe dans la barre de navigation gauche.");
    h(2, "10.2 — Champs indexés");
    h(4, "Archives numériques");
    p("Désignation, description, numéro de classe, numéro de référence, dossier, étiquettes.");
    h(4, "Documents physiques");
    p("Numéro interne, numéro de référence, sujet, catégorie, nature.");
    h(2, "10.3 — Conseils de recherche");
    bullet("Saisir au moins 2 caractères pour déclencher la recherche.");
    bullet("Utiliser des mots clés significatifs : nom propre, année, référence partielle.");
    bullet("La recherche est insensible aux majuscules / minuscules.");
    bullet("L'algorithme fuzzy trouve des résultats même avec de légères fautes de frappe.");
    addPageFooter();

    // ── CHAPITRE 11 ──────────────────────────────────────────────
    chapterHeader("11", "Rôles, permissions et sécurité");
    p("GEID Archives utilise un modèle RBAC (contrôle d'accès basé sur les rôles). Chaque utilisateur dispose d'un rôle unique déterminant ses droits d'action.");
    h(2, "11.1 — Les trois rôles");
    h(4, "Agent soumetteur");
    p("Peut soumettre des archives et consulter le fonds. Ne peut pas valider, modifier ou supprimer.");
    h(4, "Archiviste");
    p("Peut valider, modifier, configurer les DUA, gérer les transitions de cycle de vie et effectuer les rattachements. Ne peut pas supprimer.");
    h(4, "Administrateur");
    p("Dispose de tous les droits : tout ce que peut faire l'archiviste, plus la suppression, la gestion de la structure physique et la gestion des utilisateurs.");
    h(2, "11.2 — Bonnes pratiques de sécurité");
    bullet("Ne jamais partager ses identifiants avec un collègue.");
    bullet("Se déconnecter systématiquement après utilisation sur un poste partagé.");
    bullet("Signaler immédiatement tout accès suspect à l'administrateur.");
    bullet("Les administrateurs doivent auditer régulièrement la liste des comptes actifs.");
    addPageFooter();

    // ── ANNEXE A — GLOSSAIRE ─────────────────────────────────────
    doc.addPage();
    addPageHeader("Annexe A — Glossaire");
    h(1, "Annexe A — Glossaire");
    const terms = [
      ["Archive courante", "Document utilisé régulièrement pour l'activité quotidienne."],
      ["Archive définitive", "Document conservé de manière permanente pour sa valeur historique."],
      ["Archive intermédiaire", "Document en conservation obligatoire pendant la durée de la DUA."],
      ["Audit trail", "Enregistrement chronologique de toutes les actions effectuées sur un document."],
      ["Code QR", "Code à barres bidimensionnel permettant l'identification rapide par scan."],
      ["Cycle de vie", "Ensemble des états successifs d'un document depuis sa création jusqu'à sa destination finale."],
      ["DUA", "Durée d'Utilité Administrative. Délai légal de conservation obligatoire."],
      ["JWT", "JSON Web Token. Standard d'authentification sécurisé utilisé par GEID Archives."],
      ["Métadonnée", "Information descriptive associée à un document (désignation, date, référence...)."],
      ["RBAC", "Role-Based Access Control. Modèle d'attribution des droits via des rôles."],
      ["Rattachement", "Lien créé entre une archive numérique et son document physique."],
      ["Sort final", "Décision à l'expiration de la DUA : conservation définitive ou élimination."],
      ["Validation", "Acte par lequel un archiviste certifie la conformité d'une archive soumise."],
      ["Versement", "Transfert d'archives intermédiaires vers un service d'archives définitives."],
    ];
    terms.forEach(([t, d]) => {
      doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold").text(t, MARGIN_X, doc.y + 5);
      doc.fontSize(9.5).fillColor(SECONDARY).font("Helvetica")
        .text(d, MARGIN_X + 8, doc.y + 2, { width: TEXT_W - 8, lineGap: 2 });
    });
    addPageFooter();

    // ── ANNEXE B — FAQ ────────────────────────────────────────────
    doc.addPage();
    addPageHeader("Annexe B — FAQ");
    h(1, "Annexe B — Questions fréquentes");
    const faq = [
      ["Mon archive reste en attente depuis longtemps.", "Contactez votre archiviste référent en lui indiquant la désignation et la date de soumission."],
      ["Je ne vois pas le bouton Supprimer.", "La suppression est réservée aux administrateurs. Adressez une demande à votre administrateur."],
      ["Comment retrouver un document de manière approximative ?", "Utilisez Ctrl+K et saisissez des mots clés. L'algorithme fuzzy gère les imprécisions de saisie."],
      ["Peut-on changer le fichier d'une archive validée ?", "Non. Créez une nouvelle archive avec le bon fichier et supprimez l'ancienne."],
      ["Que faire si j'ai oublié mon mot de passe ?", "Contactez votre administrateur pour une réinitialisation manuelle."],
      ["Comment annuler un rattachement physique incorrect ?", "Ouvrez le panneau de détail, cliquez sur Dossier physique, puis Détacher."],
      ["Que se passe-t-il quand une DUA expire ?", "Le système génère une alerte rouge dans le tableau de bord. Un archiviste doit alors décider du sort final."],
    ];
    faq.forEach(([q, a]) => {
      doc.fontSize(10).fillColor(PRIMARY).font("Helvetica-Bold")
        .text("Q. " + q, MARGIN_X, doc.y + 8, { width: TEXT_W });
      doc.fontSize(9.5).fillColor(TEXT).font("Helvetica")
        .text("R. " + a, MARGIN_X + 8, doc.y + 2, { width: TEXT_W - 8, lineGap: 2 });
    });
    addPageFooter();

    doc.end();
  } catch (err) {
    console.error("[generateManualPdf] Erreur :", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Impossible de générer le PDF côté serveur." });
    }
  }
};
