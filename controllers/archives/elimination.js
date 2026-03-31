/**
 * controllers/archives/elimination.js
 *
 * Workflow d'élimination des archives — Directive 23
 *
 * Avant toute destruction, un procès-verbal (PV) d'élimination doit être créé,
 * approuvé par le service versant (producteur) puis par la DANTIC.
 */

const Elimination       = require('../../models/archives/elimination.model');
const Archive           = require('../../models/archives/archive.model');
const User              = require('../../models/users/user.model');
const Auth              = require('../../models/users/auth.model');
const socketStore       = require('../../socketStore');
const eliminationMailer = require('../../tools/eliminationMailer');

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
			.populate('createdBy', 'fname lname email')
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
			.populate('createdBy', 'fname lname email')
			.populate('producerApproval.approvedBy', 'fname lname email')
			.populate('danticApproval.approvedBy', 'fname lname email')
			.populate('executedBy', 'fname lname email')
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
		eliminationMailer.onPvSubmitted(pv).catch(err => console.error('[elimination:mail:submit]', err));
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
		eliminationMailer.onProducerApproved(pv).catch(err => console.error('[elimination:mail:approveProducer]', err));
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
		eliminationMailer.onDanticApproved(pv).catch(err => console.error('[elimination:mail:approveDantic]', err));
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
		const rejectedByProducer = rejectionField === 'producerApproval';
		pv.status = 'REJECTED';
		await pv.save();

		emitEliminationChange(pv._id);
		if (rejectedByProducer) {
			eliminationMailer.onProducerRejected(pv).catch(err => console.error('[elimination:mail:rejectProducer]', err));
		} else {
			eliminationMailer.onDanticRejected(pv).catch(err => console.error('[elimination:mail:rejectDantic]', err));
		}
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
		eliminationMailer.onPvExecuted(pv).catch(err => console.error('[elimination:mail:execute]', err));
		res.status(200).json(pv);
	} catch (error) {
		console.error('[elimination:execute]', error);
		res.status(500).json({ error: "Une erreur est survenue lors de l'exécution." });
	}
};

