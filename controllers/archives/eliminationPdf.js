/**
 * controllers/archives/eliminationPdf.js
 *
 * Génération du bordereau d'élimination PDF (PV)
 * Extrait de elimination.js pour respecter la limite de 500 lignes.
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const Elimination = require('../../models/archives/elimination.model');

/**
 * GET /:id/pdf — Generate bordereau d'élimination PDF
 */
exports.generatePdf = async (req, res) => {
	try {
		const pv = await Elimination.findById(req.params.id)
			.populate('archives')
			.populate('createdBy', 'fname lname email')
			.populate('producerApproval.approvedBy', 'fname lname email')
			.populate('danticApproval.approvedBy', 'fname lname email')
			.populate('executedBy', 'fname lname email')
			.lean();

		if (!pv) return res.status(404).json({ error: 'PV introuvable.' });

		// ── Helpers ─────────────────────────────────────────────────────
		const STATUS_FR = {
			DRAFT: 'Brouillon', PENDING_PRODUCER: 'Attente du service versant',
			PENDING_DANTIC: 'Attente de la DANTIC', APPROVED: 'Approuvé',
			REJECTED: 'Rejeté', EXECUTED: 'Exécuté',
			PENDING: 'En attente de validation', ACTIVE: 'Actif', SEMI_ACTIVE: 'Intermédiaire',
			PROPOSED_ELIMINATION: 'Proposé à l\'élimination', PERMANENT: 'Historique',
			DESTROYED: 'Détruit',
		};
		const tStatus = (s) => STATUS_FR[s] || s || '—';
		const tName = (u) => u ? `${u.fname || ''} ${u.lname || ''}`.trim() || '—' : '—';
		const tDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
		const tDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
		const archiveCount = (pv.archives || []).length;

		// ── Couleurs ────────────────────────────────────────────────────
		const PRIMARY = '#1565C0';
		const DARK = '#0D47A1';
		const TEXT_C = '#1A1A2E';
		const GRAY = '#546E7A';
		const LIGHT = '#E8F0FE';
		const BORDER = '#CFD8DC';
		const M = 50; // marge
		const W = 495; // largeur utile

		const doc = new PDFDocument({ size: 'A4', margin: M, info: {
			Title: `Procès-verbal d'élimination N° ${pv.pvNumber}`,
			Author: 'GEID — Secrétariat Général du Budget',
			Subject: 'Bordereau d\'élimination d\'archives',
		}});

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `inline; filename="PV-Elimination-${pv.pvNumber}.pdf"`);
		doc.pipe(res);

		// ── EN-TÊTE OFFICIEL ────────────────────────────────────────────
		// Bandeau bleu en haut
		doc.rect(0, 0, 595.28, 85).fill(DARK);

		// Logo GEID (si disponible)
		const logoPath = path.join(__dirname, '../../assets/geid_logo_white.png');
		try { doc.image(logoPath, M, 15, { height: 50 }); } catch { /* pas de logo */ }

		doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
			.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', 150, 18, { width: 400 });
		doc.fontSize(9).font('Helvetica')
			.text('Ministère du Budget — Secrétariat Général du Budget', 150, 33);
		doc.text('Direction des Archives, de la Normalisation et des TIC (DANTIC)', 150, 45);
		doc.fontSize(8).text(`${pv.administrativeUnit || '—'}`, 150, 60);

		doc.fillColor(TEXT_C);

		// ── TITRE ───────────────────────────────────────────────────────
		doc.moveDown(3);
		doc.fontSize(16).font('Helvetica-Bold').fillColor(PRIMARY)
			.text("PROCÈS-VERBAL D'ÉLIMINATION D'ARCHIVES", { align: 'center' });
		doc.moveDown(0.2);
		doc.fontSize(10).font('Helvetica').fillColor(GRAY)
			.text(`N° ${pv.pvNumber}`, { align: 'center' });
		doc.fillColor(TEXT_C);
		doc.moveDown(1);

		// Ligne de séparation
		doc.moveTo(M, doc.y).lineTo(M + W, doc.y).lineWidth(1).strokeColor(PRIMARY).stroke();
		doc.moveDown(0.8);

		// ── CADRE INFORMATIONS ──────────────────────────────────────────
		const infoY = doc.y;
		doc.rect(M, infoY, W, 105).lineWidth(0.5).strokeColor(BORDER).stroke();
		doc.rect(M, infoY, W, 20).fill(LIGHT);

		doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold')
			.text('INFORMATIONS GÉNÉRALES', M + 10, infoY + 5);

		doc.fillColor(TEXT_C).fontSize(9).font('Helvetica');
		const iY = infoY + 28;
		const labelX = M + 10;
		const valueX = M + 180;

		doc.font('Helvetica-Bold').text('Date d\'établissement :', labelX, iY);
		doc.font('Helvetica').text(tDate(pv.pvDate || pv.createdAt), valueX, iY);
		doc.font('Helvetica-Bold').text('Unité administrative :', labelX, iY + 15);
		doc.font('Helvetica').text(pv.administrativeUnit || '—', valueX, iY + 15);
		doc.font('Helvetica-Bold').text('Établi par :', labelX, iY + 30);
		doc.font('Helvetica').text(tName(pv.createdBy), valueX, iY + 30);
		doc.font('Helvetica-Bold').text('Statut :', labelX, iY + 45);
		doc.font('Helvetica').text(tStatus(pv.status), valueX, iY + 45);
		doc.font('Helvetica-Bold').text('Archives concernées :', labelX, iY + 60);
		doc.font('Helvetica').text(`${archiveCount} document${archiveCount > 1 ? 's' : ''}`, valueX, iY + 60);

		doc.y = infoY + 115;

		// ── MOTIF ───────────────────────────────────────────────────────
		doc.fontSize(10).font('Helvetica-Bold').fillColor(PRIMARY).text('MOTIF DE L\'ÉLIMINATION');
		doc.fillColor(TEXT_C).moveDown(0.3);
		doc.fontSize(9).font('Helvetica').text(pv.motif || '—', { width: W });
		doc.moveDown(1);

		// ── BASE JURIDIQUE ──────────────────────────────────────────────
		doc.fontSize(10).font('Helvetica-Bold').fillColor(PRIMARY).text('BASE JURIDIQUE');
		doc.fillColor(TEXT_C).moveDown(0.3);
		doc.fontSize(8).font('Helvetica').fillColor(GRAY)
			.text('Conformément à la Directive N° 23 de la DANTIC relative à la gestion des archives publiques, '
				+ 'l\'élimination des documents administratifs ayant atteint le terme de leur durée d\'utilité '
				+ 'administrative (DUA) est subordonnée à l\'établissement du présent procès-verbal, '
				+ 'au visa du service versant et à l\'approbation de la DANTIC.', { width: W });
		doc.fillColor(TEXT_C).moveDown(1);

		// ── TABLEAU DES ARCHIVES ────────────────────────────────────────
		doc.fontSize(10).font('Helvetica-Bold').fillColor(PRIMARY).text('INVENTAIRE DES ARCHIVES À ÉLIMINER');
		doc.fillColor(TEXT_C).moveDown(0.3);

		// En-tête tableau
		const tY = doc.y;
		doc.rect(M, tY, W, 18).fill(DARK);
		const cols = { num: M + 5, des: M + 35, ref: M + 290, type: M + 370, status: M + 440 };
		doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
		doc.text('N°', cols.num, tY + 4);
		doc.text('Désignation', cols.des, tY + 4);
		doc.text('Référence', cols.ref, tY + 4);
		doc.text('Type', cols.type, tY + 4);
		doc.text('Statut', cols.status, tY + 4);
		doc.fillColor(TEXT_C);

		let rowY = tY + 22;
		doc.font('Helvetica').fontSize(7.5);
		(pv.archives || []).forEach((a, i) => {
			if (rowY > 740) { doc.addPage(); rowY = M; }
			const bg = i % 2 === 0 ? '#FAFAFA' : 'white';
			doc.rect(M, rowY - 2, W, 15).fill(bg);
			doc.fillColor(TEXT_C);
			doc.text(String(i + 1), cols.num, rowY);
			doc.text((a.designation || '—').substring(0, 48), cols.des, rowY, { width: 250 });
			doc.text(a.refNumber || '—', cols.ref, rowY);
			doc.text(a.type?.type || '—', cols.type, rowY);
			doc.text(tStatus(a.status), cols.status, rowY);
			rowY += 15;
		});
		// Ligne de fermeture du tableau
		doc.moveTo(M, rowY).lineTo(M + W, rowY).lineWidth(0.5).strokeColor(BORDER).stroke();

		// ── VISAS ET SIGNATURES ─────────────────────────────────────────
		let vY = rowY + 25;
		if (vY > 650) { doc.addPage(); vY = M; }

		doc.fontSize(10).font('Helvetica-Bold').fillColor(PRIMARY).text('VISAS ET SIGNATURES', M, vY);
		doc.fillColor(TEXT_C);
		doc.moveTo(M, vY + 15).lineTo(M + W, vY + 15).lineWidth(0.5).strokeColor(BORDER).stroke();

		const boxW = 230;
		const boxH = 85;
		const box1X = M;
		const box2X = M + W - boxW;
		const boxTop = vY + 25;

		// Cadre service versant
		doc.rect(box1X, boxTop, boxW, boxH).lineWidth(0.5).strokeColor(BORDER).stroke();
		doc.rect(box1X, boxTop, boxW, 18).fill(LIGHT);
		doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold')
			.text('VISA DU SERVICE VERSANT', box1X + 8, boxTop + 4);
		doc.fillColor(TEXT_C).font('Helvetica').fontSize(8);

		if (pv.producerApproval?.approved) {
			doc.text(`Nom : ${tName(pv.producerApproval.approvedBy)}`, box1X + 8, boxTop + 24);
			doc.text(`Date : ${tDate(pv.producerApproval.approvedAt)}`, box1X + 8, boxTop + 38);
			doc.text(`Avis : Favorable`, box1X + 8, boxTop + 52);
			if (pv.producerApproval.note) doc.text(`Observation : ${pv.producerApproval.note}`, box1X + 8, boxTop + 66, { width: boxW - 16 });
		} else if (pv.producerApproval?.approved === false) {
			doc.text(`Nom : ${tName(pv.producerApproval.approvedBy)}`, box1X + 8, boxTop + 24);
			doc.text(`Date : ${tDate(pv.producerApproval.approvedAt)}`, box1X + 8, boxTop + 38);
			doc.fillColor('red').text('Avis : Défavorable', box1X + 8, boxTop + 52);
			doc.fillColor(TEXT_C);
			if (pv.producerApproval.note) doc.text(`Motif : ${pv.producerApproval.note}`, box1X + 8, boxTop + 66, { width: boxW - 16 });
		} else {
			doc.fillColor(GRAY).text('En attente d\'approbation', box1X + 8, boxTop + 35);
			doc.fillColor(TEXT_C);
		}

		// Cadre DANTIC
		doc.rect(box2X, boxTop, boxW, boxH).lineWidth(0.5).strokeColor(BORDER).stroke();
		doc.rect(box2X, boxTop, boxW, 18).fill(LIGHT);
		doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold')
			.text('VISA DE LA DANTIC', box2X + 8, boxTop + 4);
		doc.fillColor(TEXT_C).font('Helvetica').fontSize(8);

		if (pv.danticApproval?.approved) {
			doc.text(`Nom : ${tName(pv.danticApproval.approvedBy)}`, box2X + 8, boxTop + 24);
			doc.text(`Date : ${tDate(pv.danticApproval.approvedAt)}`, box2X + 8, boxTop + 38);
			doc.text(`Avis : Favorable`, box2X + 8, boxTop + 52);
			if (pv.danticApproval.note) doc.text(`Observation : ${pv.danticApproval.note}`, box2X + 8, boxTop + 66, { width: boxW - 16 });
		} else if (pv.danticApproval?.approved === false) {
			doc.text(`Nom : ${tName(pv.danticApproval.approvedBy)}`, box2X + 8, boxTop + 24);
			doc.text(`Date : ${tDate(pv.danticApproval.approvedAt)}`, box2X + 8, boxTop + 38);
			doc.fillColor('red').text('Avis : Défavorable', box2X + 8, boxTop + 52);
			doc.fillColor(TEXT_C);
			if (pv.danticApproval.note) doc.text(`Motif : ${pv.danticApproval.note}`, box2X + 8, boxTop + 66, { width: boxW - 16 });
		} else {
			doc.fillColor(GRAY).text('En attente d\'approbation', box2X + 8, boxTop + 35);
			doc.fillColor(TEXT_C);
		}

		// ── EXÉCUTION (si exécuté) ──────────────────────────────────────
		if (pv.status === 'EXECUTED') {
			let eY = boxTop + boxH + 20;
			if (eY > 720) { doc.addPage(); eY = M; }
			doc.rect(M, eY, W, 50).lineWidth(0.5).strokeColor('#C62828').stroke();
			doc.rect(M, eY, W, 18).fill('#FFEBEE');
			doc.fillColor('#C62828').fontSize(9).font('Helvetica-Bold')
				.text('EXÉCUTION DE L\'ÉLIMINATION', M + 8, eY + 4);
			doc.fillColor(TEXT_C).font('Helvetica').fontSize(8);
			doc.text(`Exécuté par : ${tName(pv.executedBy)}`, M + 8, eY + 24);
			doc.text(`Date d'exécution : ${tDate(pv.executedAt)}`, M + 8, eY + 36);
			doc.text(`${archiveCount} archive${archiveCount > 1 ? 's' : ''} définitivement détruites`, M + 200, eY + 24);
		}

		// ── PIED DE PAGE ────────────────────────────────────────────────
		// Bandeau en bas
		doc.rect(0, 841.89 - 40, 595.28, 40).fill(DARK);
		doc.fillColor('white').fontSize(7).font('Helvetica')
			.text('Document officiel généré par le système GEID — Secrétariat Général du Budget, RDC',
				M, 841.89 - 28, { align: 'center', width: W });
		doc.text(`Réf. ${pv.pvNumber} — ${tDateShort(new Date())}`, M, 841.89 - 16, { align: 'center', width: W });

		doc.end();
	} catch (error) {
		console.error('[elimination:generatePdf]', error);
		res.status(500).json({ error: 'Erreur lors de la génération du PDF.' });
	}
};
