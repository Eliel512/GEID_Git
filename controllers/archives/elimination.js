/**
 * controllers/archives/elimination.js
 *
 * Workflow d'élimination des archives — Directive 23
 *
 * Avant toute destruction, un procès-verbal (PV) d'élimination doit être créé,
 * approuvé par le service versant (producteur) puis par la DANTIC.
 */

const Elimination  = require('../../models/archives/elimination.model');
const Archive      = require('../../models/archives/archive.model');
const User         = require('../../models/users/user.model');
const Auth         = require('../../models/users/auth.model');
const socketStore  = require('../../socketStore');

// ── Helpers ─────────────────────────────────────────────────────────────────

function emitEliminationChange(pvId) {
	const io = socketStore.getInstance();
	if (io) io.emit('elimination:change', { pvId });
}

/**
 * Vérifie les droits d'un utilisateur sur le cadre organique.
 * Retourne { isAdmin, hasWriteOnUnit } basé sur les permissions archives.
 */
async function checkPermissions(userId, administrativeUnit) {
	const user = await User.findById(userId, { auth: 1 });
	if (!user?.auth) return { isAdmin: false, hasWriteOnUnit: false };
	const auth = await Auth.findById(user.auth);
	if (!auth) return { isAdmin: false, hasWriteOnUnit: false };
	const archPriv = auth.privileges?.find(p => p.app === 'archives');
	if (!archPriv) return { isAdmin: false, hasWriteOnUnit: false };
	const perms = archPriv.permissions || [];
	const isAdmin = perms.some(p => p.struct === 'all' && p.access === 'write');
	const hasWriteOnUnit = isAdmin || perms.some(
		p => (p.struct === administrativeUnit) && p.access === 'write'
	);
	return { isAdmin, hasWriteOnUnit };
}

/**
 * Generate a sequential PV number: PV-ELIM-YYYY-NNNN
 */
async function generatePvNumber() {
	const year = new Date().getFullYear();
	const prefix = `PV-ELIM-${year}-`;

	const last = await Elimination.findOne(
		{ pvNumber: { $regex: `^${prefix}` } },
		{ pvNumber: 1 },
		{ sort: { pvNumber: -1 } }
	);

	let seq = 1;
	if (last && last.pvNumber) {
		const parts = last.pvNumber.split('-');
		seq = parseInt(parts[parts.length - 1], 10) + 1;
	}

	return `${prefix}${String(seq).padStart(4, '0')}`;
}

// ── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST / — Create a new elimination PV (DRAFT)
 * Body: { archives: [id, ...], motif: string, administrativeUnit: string }
 */
exports.create = async (req, res) => {
	try {
		const { archives, motif, administrativeUnit } = req.body;

		if (!archives || !archives.length) {
			return res.status(400).json({ error: 'Au moins une archive doit être sélectionnée.' });
		}
		if (!motif) {
			return res.status(400).json({ error: "Le motif d'élimination est requis." });
		}

		const pvNumber = await generatePvNumber();

		const elimination = await Elimination.create({
			archives,
			pvNumber,
			motif,
			administrativeUnit,
			createdBy: res.locals.userId,
			status: 'DRAFT'
		});

		emitEliminationChange(elimination._id);
		res.status(201).json(elimination);
	} catch (error) {
		console.error('[elimination:create]', error);
		res.status(500).json({ error: 'Une erreur est survenue lors de la création du PV.' });
	}
};

/**
 * GET / — List all elimination PVs (filtered by admin unit if provided)
 * Query: ?administrativeUnit=xxx
 */
exports.getAll = async (req, res) => {
	try {
		const filter = {};
		if (req.query.administrativeUnit) {
			filter.administrativeUnit = req.query.administrativeUnit;
		}

		const pvs = await Elimination.find(filter)
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json(pvs);
	} catch (error) {
		console.error('[elimination:getAll]', error);
		res.status(500).json({ error: 'Une erreur est survenue.' });
	}
};

/**
 * GET /:id — Get one PV with populated archives
 */
exports.getOne = async (req, res) => {
	try {
		const pv = await Elimination.findById(req.params.id)
			.populate('archives')
			.populate('createdBy', 'name surname')
			.populate('producerApproval.approvedBy', 'name surname')
			.populate('danticApproval.approvedBy', 'name surname')
			.populate('executedBy', 'name surname')
			.lean();

		if (!pv) {
			return res.status(404).json({ error: 'PV introuvable.' });
		}

		res.status(200).json(pv);
	} catch (error) {
		console.error('[elimination:getOne]', error);
		res.status(500).json({ error: 'Une erreur est survenue.' });
	}
};

/**
 * PATCH /:id/submit — Submit for approval (DRAFT -> PENDING_PRODUCER)
 */
exports.submit = async (req, res) => {
	try {
		const pv = await Elimination.findById(req.params.id);
		if (!pv) return res.status(404).json({ error: 'PV introuvable.' });

		if (pv.status !== 'DRAFT') {
			return res.status(422).json({
				error: 'Seul un PV en brouillon peut être soumis pour approbation.'
			});
		}

		pv.status = 'PENDING_PRODUCER';
		await pv.save();

		emitEliminationChange(pv._id);
		res.status(200).json(pv);
	} catch (error) {
		console.error('[elimination:submit]', error);
		res.status(500).json({ error: 'Une erreur est survenue.' });
	}
};

/**
 * PATCH /:id/approve-producer — Producer approves (PENDING_PRODUCER -> PENDING_DANTIC)
 * Body: { note?: string }
 */
exports.approveProducer = async (req, res) => {
	try {
		const pv = await Elimination.findById(req.params.id);
		if (!pv) return res.status(404).json({ error: 'PV introuvable.' });

		if (pv.status !== 'PENDING_PRODUCER') {
			return res.status(422).json({
				error: "Ce PV n'est pas en attente d'approbation du service versant."
			});
		}

		// Seul un utilisateur ayant accès en écriture sur l'unité du PV peut approuver
		const { hasWriteOnUnit } = await checkPermissions(res.locals.userId, pv.administrativeUnit);
		if (!hasWriteOnUnit) {
			return res.status(403).json({
				error: "Vous n'avez pas les droits d'approbation sur cette unité administrative."
			});
		}

		pv.producerApproval = {
			approved: true,
			approvedBy: res.locals.userId,
			approvedAt: new Date(),
			note: req.body.note || ''
		};
		pv.status = 'PENDING_DANTIC';
		await pv.save();

		emitEliminationChange(pv._id);
		res.status(200).json(pv);
	} catch (error) {
		console.error('[elimination:approveProducer]', error);
		res.status(500).json({ error: 'Une erreur est survenue.' });
	}
};

/**
 * PATCH /:id/approve-dantic — DANTIC approves (PENDING_DANTIC -> APPROVED)
 * Body: { note?: string }
 */
exports.approveDantic = async (req, res) => {
	try {
		const pv = await Elimination.findById(req.params.id);
		if (!pv) return res.status(404).json({ error: 'PV introuvable.' });

		if (pv.status !== 'PENDING_DANTIC') {
			return res.status(422).json({
				error: "Ce PV n'est pas en attente d'approbation de la DANTIC."
			});
		}

		// Seul un administrateur (DANTIC — struct=all + write) peut approuver
		const { isAdmin: isDantic } = await checkPermissions(res.locals.userId, pv.administrativeUnit);
		if (!isDantic) {
			return res.status(403).json({
				error: "Seul un membre de la DANTIC peut approuver cette étape."
			});
		}

		pv.danticApproval = {
			approved: true,
			approvedBy: res.locals.userId,
			approvedAt: new Date(),
			note: req.body.note || ''
		};
		pv.status = 'APPROVED';
		await pv.save();

		emitEliminationChange(pv._id);
		res.status(200).json(pv);
	} catch (error) {
		console.error('[elimination:approveDantic]', error);
		res.status(500).json({ error: 'Une erreur est survenue.' });
	}
};

/**
 * PATCH /:id/reject — Reject at any pending stage (-> REJECTED)
 * Body: { note?: string }
 */
exports.reject = async (req, res) => {
	try {
		const pv = await Elimination.findById(req.params.id);
		if (!pv) return res.status(404).json({ error: 'PV introuvable.' });

		if (!['PENDING_PRODUCER', 'PENDING_DANTIC'].includes(pv.status)) {
			return res.status(422).json({
				error: 'Seul un PV en attente de validation peut être rejeté.'
			});
		}

		// Record who rejected and at which stage
		const rejectionField = pv.status === 'PENDING_PRODUCER'
			? 'producerApproval'
			: 'danticApproval';

		pv[rejectionField] = {
			approved: false,
			approvedBy: res.locals.userId,
			approvedAt: new Date(),
			note: req.body.note || ''
		};
		pv.status = 'REJECTED';
		await pv.save();

		emitEliminationChange(pv._id);
		res.status(200).json(pv);
	} catch (error) {
		console.error('[elimination:reject]', error);
		res.status(500).json({ error: 'Une erreur est survenue.' });
	}
};

/**
 * PATCH /:id/execute — Execute elimination (APPROVED -> EXECUTED)
 * Destroys all linked archives and records lifecycle history.
 */
exports.execute = async (req, res) => {
	try {
		const pv = await Elimination.findById(req.params.id);
		if (!pv) return res.status(404).json({ error: 'PV introuvable.' });

		if (pv.status !== 'APPROVED') {
			return res.status(422).json({
				error: "Seul un PV approuvé peut être exécuté."
			});
		}

		// Seul un administrateur (DANTIC) peut exécuter la destruction
		const { isAdmin: canExecute } = await checkPermissions(res.locals.userId, pv.administrativeUnit);
		if (!canExecute) {
			return res.status(403).json({
				error: "Seul un administrateur peut exécuter la destruction des archives."
			});
		}

		// Destroy all linked archives
		const historyEntry = {
			status: 'DESTROYED',
			changedAt: new Date(),
			changedBy: res.locals.userId,
			note: `Éliminée — PV d'élimination N° ${pv.pvNumber}`
		};

		await Archive.updateMany(
			{ _id: { $in: pv.archives } },
			{
				$set: { status: 'DESTROYED', validated: true },
				$push: { lifecycleHistory: historyEntry }
			}
		);

		// Mark PV as executed
		pv.status = 'EXECUTED';
		pv.executedAt = new Date();
		pv.executedBy = res.locals.userId;
		await pv.save();

		emitEliminationChange(pv._id);
		res.status(200).json(pv);
	} catch (error) {
		console.error('[elimination:execute]', error);
		res.status(500).json({ error: "Une erreur est survenue lors de l'exécution." });
	}
};

/**
 * GET /:id/pdf — Generate bordereau d'élimination PDF
 */
exports.generatePdf = async (req, res) => {
	try {
		const PDFDocument = require('pdfkit');

		const pv = await Elimination.findById(req.params.id)
			.populate('archives')
			.populate('createdBy', 'name surname')
			.populate('producerApproval.approvedBy', 'name surname')
			.populate('danticApproval.approvedBy', 'name surname')
			.populate('administrativeUnit', 'name')
			.lean();

		if (!pv) return res.status(404).json({ error: 'PV introuvable.' });

		const doc = new PDFDocument({ size: 'A4', margin: 50 });

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader(
			'Content-Disposition',
			`inline; filename="bordereau-elimination-${pv.pvNumber}.pdf"`
		);
		doc.pipe(res);

		// ── Header ──────────────────────────────────────────────────────
		doc.fontSize(16).font('Helvetica-Bold')
			.text("BORDEREAU D'ÉLIMINATION", { align: 'center' });
		doc.moveDown(0.5);
		doc.fontSize(11).font('Helvetica')
			.text(`Procès-verbal N° : ${pv.pvNumber}`, { align: 'center' });
		doc.text(`Date : ${new Date(pv.pvDate).toLocaleDateString('fr-FR')}`, { align: 'center' });
		doc.moveDown();

		// ── Administrative info ─────────────────────────────────────────
		doc.fontSize(10).font('Helvetica-Bold').text('Unité administrative : ', { continued: true });
		doc.font('Helvetica').text(pv.administrativeUnit?.name || '—');
		doc.font('Helvetica-Bold').text('Motif : ', { continued: true });
		doc.font('Helvetica').text(pv.motif);
		doc.font('Helvetica-Bold').text('Statut : ', { continued: true });
		doc.font('Helvetica').text(pv.status);
		doc.moveDown();

		// ── Archives table ──────────────────────────────────────────────
		doc.fontSize(12).font('Helvetica-Bold').text('Archives concernées');
		doc.moveDown(0.3);

		const tableTop = doc.y;
		const col = { num: 50, designation: 90, ref: 320, status: 420 };

		// Header row
		doc.fontSize(9).font('Helvetica-Bold');
		doc.text('N°', col.num, tableTop);
		doc.text('Désignation', col.designation, tableTop);
		doc.text('Réf.', col.ref, tableTop);
		doc.text('Statut', col.status, tableTop);
		doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).stroke();

		// Data rows
		let y = tableTop + 20;
		doc.font('Helvetica').fontSize(8);

		(pv.archives || []).forEach((archive, i) => {
			if (y > 750) {
				doc.addPage();
				y = 50;
			}
			doc.text(String(i + 1), col.num, y);
			doc.text(
				(archive.designation || '—').substring(0, 40),
				col.designation, y
			);
			doc.text(archive.refNumber || '—', col.ref, y);
			doc.text(archive.status || '—', col.status, y);
			y += 16;
		});

		doc.moveDown(2);

		// ── Signatures ──────────────────────────────────────────────────
		const sigY = Math.max(y + 30, doc.y + 30);
		if (sigY > 720) doc.addPage();
		const sigStartY = sigY > 720 ? 50 : sigY;

		doc.fontSize(10).font('Helvetica-Bold');
		doc.text('Service versant', 50, sigStartY);
		doc.text('DANTIC', 320, sigStartY);

		doc.fontSize(9).font('Helvetica');
		if (pv.producerApproval?.approved) {
			const name = pv.producerApproval.approvedBy
				? `${pv.producerApproval.approvedBy.name || ''} ${pv.producerApproval.approvedBy.surname || ''}`
				: '—';
			doc.text(`Approuvé par : ${name}`, 50, sigStartY + 16);
			doc.text(
				`Le : ${new Date(pv.producerApproval.approvedAt).toLocaleDateString('fr-FR')}`,
				50, sigStartY + 28
			);
		} else {
			doc.text('En attente', 50, sigStartY + 16);
		}

		if (pv.danticApproval?.approved) {
			const name = pv.danticApproval.approvedBy
				? `${pv.danticApproval.approvedBy.name || ''} ${pv.danticApproval.approvedBy.surname || ''}`
				: '—';
			doc.text(`Approuvé par : ${name}`, 320, sigStartY + 16);
			doc.text(
				`Le : ${new Date(pv.danticApproval.approvedAt).toLocaleDateString('fr-FR')}`,
				320, sigStartY + 28
			);
		} else {
			doc.text('En attente', 320, sigStartY + 16);
		}

		doc.end();
	} catch (error) {
		console.error('[elimination:generatePdf]', error);
		res.status(500).json({ error: 'Erreur lors de la génération du PDF.' });
	}
};
