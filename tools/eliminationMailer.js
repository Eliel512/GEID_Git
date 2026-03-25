/**
 * tools/eliminationMailer.js
 *
 * Envoie les notifications email à chaque étape du workflow d'élimination.
 * Toutes les fonctions sont non-bloquantes : elles ne doivent jamais
 * empêcher la réponse API de partir.
 */

const sendMail = require('../handlers/room/sendMail');
const buildEmail = require('./emailTemplate');
const User = require('../models/users/user.model');
const Auth = require('../models/users/auth.model');

const APP_URL = 'https://geidbudget.com/apps/archives/';
const FROM = 'GEID <' + (process.env.GEID_EMAIL || 'noreply@geidbudget.com') + '>';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fullName(user) {
	if (!user) return 'Utilisateur';
	return [user.fname, user.lname].filter(Boolean).join(' ') || 'Utilisateur';
}

/**
 * Retourne les emails des administrateurs DANTIC
 * (struct=all, access=write dans l'app archives).
 */
async function getAdminEmails() {
	const auths = await Auth.find({
		'privileges': {
			$elemMatch: {
				app: 'archives',
				permissions: { $elemMatch: { struct: 'all', access: 'write' } }
			}
		}
	}, { _id: 1 }).lean();

	if (!auths.length) return [];

	const authIds = auths.map(a => String(a._id));
	const users = await User.find(
		{ auth: { $in: authIds }, isValid: true },
		{ email: 1, fname: 1, lname: 1 }
	).lean();

	return users.filter(u => u.email);
}

/**
 * Retourne les emails des utilisateurs ayant accès en écriture
 * sur une unité administrative donnée (ou struct=all).
 */
async function getUnitWriterEmails(unit) {
	const auths = await Auth.find({
		'privileges': {
			$elemMatch: {
				app: 'archives',
				permissions: {
					$elemMatch: {
						struct: { $in: [unit, 'all'] },
						access: 'write'
					}
				}
			}
		}
	}, { _id: 1 }).lean();

	if (!auths.length) return [];

	const authIds = auths.map(a => String(a._id));
	const users = await User.find(
		{ auth: { $in: authIds }, isValid: true },
		{ email: 1, fname: 1, lname: 1 }
	).lean();

	return users.filter(u => u.email);
}

/**
 * Retourne les informations d'un utilisateur par son ID.
 */
async function getUser(userId) {
	if (!userId) return null;
	return User.findById(userId, { email: 1, fname: 1, lname: 1 }).lean();
}

// ── Notification functions ───────────────────────────────────────────────────

/**
 * PV soumis pour approbation → notifie le service versant (unit writers)
 */
exports.onPvSubmitted = async (pv) => {
	const recipients = await getUnitWriterEmails(pv.administrativeUnit);
	if (!recipients.length) return;

	const creator = await getUser(pv.createdBy);
	const creatorName = fullName(creator);

	const html = buildEmail({
		title: "Nouveau procès-verbal d'élimination à examiner",
		greeting: 'Bonjour,',
		body: `
			<p>Le procès-verbal <strong>N° ${pv.pvNumber}</strong> a été soumis pour votre approbation par ${creatorName}.</p>
			<p>
				<strong>Nombre d'archives concernées :</strong> ${(pv.archives || []).length}<br>
				<strong>Unité administrative :</strong> ${pv.administrativeUnit || '—'}<br>
				<strong>Motif :</strong> ${pv.motif || '—'}
			</p>
			<p>Veuillez examiner ce procès-verbal et donner votre avis.</p>
		`,
		ctaLabel: 'Consulter le procès-verbal',
		ctaUrl: APP_URL
	});

	const targets = recipients.map(u => ({ email: u.email }));
	sendMail(targets, html, FROM, `GEID — PV d'élimination ${pv.pvNumber} à examiner`);
};

/**
 * Service versant a approuvé → notifie les admins DANTIC + le créateur
 */
exports.onProducerApproved = async (pv) => {
	const admins = await getAdminEmails();
	const creator = await getUser(pv.createdBy);
	const creatorName = fullName(creator);

	// Notifier les admins DANTIC
	if (admins.length) {
		const htmlAdmin = buildEmail({
			title: "Procès-verbal approuvé par le service versant",
			greeting: 'Bonjour,',
			body: `
				<p>Le procès-verbal <strong>N° ${pv.pvNumber}</strong> a été approuvé par le service versant et attend maintenant votre validation en tant que DANTIC.</p>
				<p>
					<strong>Nombre d'archives concernées :</strong> ${(pv.archives || []).length}<br>
					<strong>Unité administrative :</strong> ${pv.administrativeUnit || '—'}<br>
					<strong>Motif :</strong> ${pv.motif || '—'}
				</p>
				<p>Veuillez examiner ce procès-verbal et prendre une décision.</p>
			`,
			ctaLabel: 'Consulter le procès-verbal',
			ctaUrl: APP_URL
		});

		const adminTargets = admins.map(u => ({ email: u.email }));
		sendMail(adminTargets, htmlAdmin, FROM, `GEID — PV ${pv.pvNumber} en attente de validation DANTIC`);
	}

	// Notifier le créateur
	if (creator?.email) {
		const htmlCreator = buildEmail({
			title: "Votre procès-verbal a été approuvé par le service versant",
			greeting: `Bonjour ${creatorName},`,
			body: `
				<p>Votre procès-verbal <strong>N° ${pv.pvNumber}</strong> a été approuvé par le service versant.</p>
				<p>Il est maintenant transmis à la DANTIC pour validation finale.</p>
			`,
			ctaLabel: 'Suivre le procès-verbal',
			ctaUrl: APP_URL
		});

		sendMail([{ email: creator.email }], htmlCreator, FROM, `GEID — PV ${pv.pvNumber} approuvé par le service versant`);
	}
};

/**
 * Service versant a rejeté → notifie le créateur
 */
exports.onProducerRejected = async (pv) => {
	const creator = await getUser(pv.createdBy);
	if (!creator?.email) return;

	const note = pv.producerApproval?.note;
	const noteBlock = note
		? `<p><strong>Observation :</strong> ${note}</p>`
		: '';

	const html = buildEmail({
		title: "Procès-verbal rejeté par le service versant",
		greeting: `Bonjour ${fullName(creator)},`,
		body: `
			<p>Votre procès-verbal <strong>N° ${pv.pvNumber}</strong> a été rejeté par le service versant.</p>
			${noteBlock}
			<p>Vous pouvez modifier le procès-verbal et le soumettre à nouveau si nécessaire.</p>
		`,
		ctaLabel: 'Consulter le procès-verbal',
		ctaUrl: APP_URL
	});

	sendMail([{ email: creator.email }], html, FROM, `GEID — PV ${pv.pvNumber} rejeté par le service versant`);
};

/**
 * DANTIC a approuvé → notifie le créateur + l'approbateur du service versant
 */
exports.onDanticApproved = async (pv) => {
	const targets = [];
	const creator = await getUser(pv.createdBy);
	const producerApprover = pv.producerApproval?.approvedBy
		? await getUser(pv.producerApproval.approvedBy)
		: null;

	if (creator?.email) targets.push({ email: creator.email });
	if (producerApprover?.email && producerApprover.email !== creator?.email) {
		targets.push({ email: producerApprover.email });
	}

	if (!targets.length) return;

	const html = buildEmail({
		title: "Procès-verbal approuvé par la DANTIC",
		greeting: 'Bonjour,',
		body: `
			<p>Le procès-verbal <strong>N° ${pv.pvNumber}</strong> a été approuvé par la DANTIC.</p>
			<p>
				<strong>Nombre d'archives concernées :</strong> ${(pv.archives || []).length}<br>
				<strong>Unité administrative :</strong> ${pv.administrativeUnit || '—'}<br>
				<strong>Motif :</strong> ${pv.motif || '—'}
			</p>
			<p>L'élimination des archives peut maintenant être exécutée par un administrateur.</p>
		`,
		ctaLabel: 'Consulter le procès-verbal',
		ctaUrl: APP_URL
	});

	sendMail(targets, html, FROM, `GEID — PV ${pv.pvNumber} approuvé par la DANTIC`);
};

/**
 * DANTIC a rejeté → notifie le créateur + l'approbateur du service versant
 */
exports.onDanticRejected = async (pv) => {
	const targets = [];
	const creator = await getUser(pv.createdBy);
	const producerApprover = pv.producerApproval?.approvedBy
		? await getUser(pv.producerApproval.approvedBy)
		: null;

	if (creator?.email) targets.push({ email: creator.email });
	if (producerApprover?.email && producerApprover.email !== creator?.email) {
		targets.push({ email: producerApprover.email });
	}

	if (!targets.length) return;

	const note = pv.danticApproval?.note;
	const noteBlock = note
		? `<p><strong>Observation de la DANTIC :</strong> ${note}</p>`
		: '';

	const html = buildEmail({
		title: "Procès-verbal rejeté par la DANTIC",
		greeting: 'Bonjour,',
		body: `
			<p>Le procès-verbal <strong>N° ${pv.pvNumber}</strong> a été rejeté par la DANTIC.</p>
			${noteBlock}
			<p>Veuillez prendre connaissance de cette décision et apporter les corrections nécessaires si applicable.</p>
		`,
		ctaLabel: 'Consulter le procès-verbal',
		ctaUrl: APP_URL
	});

	sendMail(targets, html, FROM, `GEID — PV ${pv.pvNumber} rejeté par la DANTIC`);
};

/**
 * PV exécuté (archives détruites) → notifie le créateur + tous les approbateurs
 */
exports.onPvExecuted = async (pv) => {
	const targets = [];
	const seen = new Set();

	const creator = await getUser(pv.createdBy);
	if (creator?.email) {
		targets.push({ email: creator.email });
		seen.add(creator.email);
	}

	const producerApprover = pv.producerApproval?.approvedBy
		? await getUser(pv.producerApproval.approvedBy)
		: null;
	if (producerApprover?.email && !seen.has(producerApprover.email)) {
		targets.push({ email: producerApprover.email });
		seen.add(producerApprover.email);
	}

	const danticApprover = pv.danticApproval?.approvedBy
		? await getUser(pv.danticApproval.approvedBy)
		: null;
	if (danticApprover?.email && !seen.has(danticApprover.email)) {
		targets.push({ email: danticApprover.email });
		seen.add(danticApprover.email);
	}

	if (!targets.length) return;

	const html = buildEmail({
		title: "Élimination exécutée",
		greeting: 'Bonjour,',
		body: `
			<p>Le procès-verbal <strong>N° ${pv.pvNumber}</strong> a été exécuté. Les archives concernées ont été définitivement éliminées.</p>
			<p>
				<strong>Nombre d'archives éliminées :</strong> ${(pv.archives || []).length}<br>
				<strong>Unité administrative :</strong> ${pv.administrativeUnit || '—'}<br>
				<strong>Motif :</strong> ${pv.motif || '—'}<br>
				<strong>Date d'exécution :</strong> ${new Date().toLocaleDateString('fr-FR')}
			</p>
			<p>Ce procès-verbal est maintenant clôturé.</p>
		`,
		ctaLabel: 'Consulter le procès-verbal',
		ctaUrl: APP_URL
	});

	sendMail(targets, html, FROM, `GEID — PV ${pv.pvNumber} exécuté — archives éliminées`);
};
