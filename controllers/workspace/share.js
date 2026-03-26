const crypto = require('crypto');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ShareInvitation = require('../../models/workspace/shareInvitation.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const User = require('../../models/users/user.model');
const sendMail = require('../../handlers/room/sendMail');
const buildEmail = require('../../tools/emailTemplate');

function getHost() {
  return require('../getHost').getHost();
}

/**
 * POST /api/stuff/workspace/share
 * Body: { fileId, targetEmail?, targetUserId?, permission?, message? }
 * Partage un fichier/dossier avec un utilisateur (par email ou userId).
 * Crée une invitation, envoie un email + notification socket.
 */
exports.shareWithUser = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, targetEmail, targetUserId, permission, message } = req.body;

  if (!fileId || (!targetEmail && !targetUserId)) {
    return res.status(400).json({ message: 'Veuillez indiquer un fichier et un destinataire.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    // Trouver le destinataire
    let targetUser;
    if (targetUserId) {
      targetUser = await User.findById(targetUserId).lean();
    } else if (targetEmail) {
      targetUser = await User.findOne({ email: targetEmail.trim().toLowerCase() }).lean();
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'Cet utilisateur n\'existe pas dans GEID. Vérifiez l\'adresse email.' });
    }

    const targetId = targetUser._id.toString();
    if (targetId === userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas partager un fichier avec vous-même.' });
    }

    // Vérifier si une invitation pending existe déjà
    const existingInvite = await ShareInvitation.findOne({
      from: userId, to: targetId, fileId: file._id, status: 'pending',
    });
    if (existingInvite) {
      return res.status(409).json({ message: 'Une invitation est déjà en attente pour ce fichier.' });
    }

    // Créer l'invitation
    const invitation = new ShareInvitation({
      from: userId,
      to: targetId,
      fileId: file._id,
      fileName: file.name,
      isDirectory: file.isDirectory || false,
      permission: permission || 'view',
      message: message || '',
    });
    await invitation.save();

    // Si c'est un dossier, partager aussi tous les fichiers dedans (récursif)
    if (file.isDirectory) {
      const { escapeRegex } = require('./utils');
      const folderPath = file.path ? `${file.path}/${file.name}` : file.name;
      const children = await WorkspaceFile.find({
        owner: userId,
        isTrashed: { $ne: true },
        isDirectory: false,
        $or: [
          { path: folderPath },
          { path: { $regex: `^${escapeRegex(folderPath)}/` } },
        ],
      });
      for (const child of children) {
        const alreadyShared = child.sharedWith?.find(s => s.userId === targetId);
        if (!alreadyShared) {
          child.sharedWith.push({ userId: targetId, permission: permission || 'view' });
          await child.save();
        }
      }
    }

    // Activity log
    new ActivityLog({
      userId,
      action: 'share',
      targetId: file._id,
      targetName: file.name,
      details: { targetUserId: targetId, permission: permission || 'view' },
    }).save().catch(() => {});

    // Notification socket en temps réel
    try {
      const io = require('../../socketStore').getInstance();
      if (io) {
        const sender = await User.findById(userId, 'fname lname email').lean();
        const senderName = [sender?.fname, sender?.lname].filter(Boolean).join(' ') || sender?.email || 'Un utilisateur';
        io.emit('workspace:share-invitation', {
          invitation: { ...invitation.toObject(), fromName: senderName },
          targetUserId: targetId,
        });
      }
    } catch {}

    // Email de notification
    try {
      const sender = await User.findById(userId, 'fname lname email').lean();
      const senderName = [sender?.fname, sender?.lname].filter(Boolean).join(' ');
      const host = getHost();
      const appUrl = `https://${host}/apps/workspaces/shared`;

      const html = buildEmail({
        title: 'Invitation de partage',
        greeting: `Bonjour ${targetUser.fname || ''},`,
        body: `
          <p><strong>${senderName}</strong> souhaite partager ${file.isDirectory ? 'un dossier' : 'un fichier'} avec vous :</p>
          <table style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:16px 0;">
            <tr>
              <td style="padding:12px 16px;">
                <strong>${file.name}</strong><br>
                <span style="color:#666;font-size:13px;">Permission : ${(permission || 'view') === 'edit' ? 'Lecture et modification' : 'Lecture seule'}</span>
                ${message ? `<br><span style="color:#666;font-size:13px;font-style:italic;">« ${message} »</span>` : ''}
              </td>
            </tr>
          </table>
          <p>Rendez-vous dans votre <strong>Espace partagé</strong> pour accepter ou refuser cette invitation.</p>
        `,
        ctaLabel: 'Voir dans GEID',
        ctaUrl: appUrl,
        footer: 'Vous recevez cet email car un utilisateur GEID souhaite partager un fichier avec vous.',
      });

      sendMail(
        [{ email: targetUser.email }],
        html,
        `GEID <${process.env.GEID_EMAIL || 'noreply@geidbudget.com'}>`,
        `${senderName} vous a partagé ${file.isDirectory ? 'un dossier' : 'un fichier'}`
      );
    } catch (err) {
      console.error('[share.email]', err.message);
    }

    res.status(200).json({ message: 'Invitation envoyée avec succès.', invitation });
  } catch (err) {
    console.error('[share.shareWithUser]', err);
    res.status(500).json({ message: 'Impossible de partager le fichier.' });
  }
};

/**
 * GET /api/stuff/workspace/share/invitations
 * Liste les invitations reçues (pending).
 */
exports.getInvitations = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const invitations = await ShareInvitation.find({ to: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();

    // Enrichir avec les noms des expéditeurs
    const fromIds = [...new Set(invitations.map(i => i.from))];
    const users = await User.find({ _id: { $in: fromIds } }, 'fname lname email imageUrl').lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const enriched = invitations.map(inv => ({
      ...inv,
      fromUser: userMap[inv.from] || null,
    }));

    res.status(200).json(enriched);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les invitations.' });
  }
};

/**
 * PATCH /api/stuff/workspace/share/accept/:id
 * Accepte une invitation — ajoute le fichier dans sharedWith.
 */
exports.acceptInvitation = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;

  try {
    const invitation = await ShareInvitation.findOne({ _id: id, to: userId, status: 'pending' });
    if (!invitation) return res.status(404).json({ message: 'Invitation introuvable.' });

    // Ajouter dans sharedWith du fichier/dossier
    const file = await WorkspaceFile.findById(invitation.fileId);
    if (file) {
      const existing = file.sharedWith.find(s => s.userId === userId);
      if (!existing) {
        file.sharedWith.push({ userId, permission: invitation.permission });
        await file.save();
      }

      // Si c'est un dossier, accepter aussi tous les fichiers dedans
      if (file.isDirectory) {
        const { escapeRegex } = require('./utils');
        const folderPath = file.path ? `${file.path}/${file.name}` : file.name;
        const children = await WorkspaceFile.find({
          owner: file.owner,
          isTrashed: { $ne: true },
          isDirectory: false,
          $or: [
            { path: folderPath },
            { path: { $regex: `^${escapeRegex(folderPath)}/` } },
          ],
        });
        for (const child of children) {
          const alreadyShared = child.sharedWith?.find(s => s.userId === userId);
          if (!alreadyShared) {
            child.sharedWith.push({ userId, permission: invitation.permission });
            await child.save();
          }
        }
      }
    }

    invitation.status = 'accepted';
    await invitation.save();

    // Notification socket à l'expéditeur (accusé de réception)
    try {
      const io = require('../../socketStore').getInstance();
      if (io) {
        const accepter = await User.findById(userId, 'fname lname email').lean();
        const accepterName = [accepter?.fname, accepter?.lname].filter(Boolean).join(' ') || accepter?.email;
        io.emit('workspace:share-accepted', {
          invitation: invitation.toObject(),
          targetUserId: invitation.from,
          accepterName,
        });
      }
    } catch {}

    // Email accusé de réception à l'expéditeur
    try {
      const sender = await User.findById(invitation.from, 'fname lname email').lean();
      const accepter = await User.findById(userId, 'fname lname email').lean();
      const accepterName = [accepter?.fname, accepter?.lname].filter(Boolean).join(' ');

      if (sender?.email) {
        const html = buildEmail({
          title: 'Partage accepté',
          greeting: `Bonjour ${sender.fname || ''},`,
          body: `<p><strong>${accepterName}</strong> a accepté votre invitation de partage pour le fichier <strong>${invitation.fileName}</strong>.</p>
                 <p>Ce fichier est maintenant accessible dans l'espace partagé du destinataire.</p>`,
          footer: 'Notification automatique de partage GEID.',
        });
        sendMail(
          [{ email: sender.email }],
          html,
          `GEID <${process.env.GEID_EMAIL || 'noreply@geidbudget.com'}>`,
          `${accepterName} a accepté votre partage`
        );
      }
    } catch {}

    res.status(200).json({ message: 'Invitation acceptée.' });
  } catch {
    res.status(500).json({ message: 'Impossible d\'accepter l\'invitation.' });
  }
};

/**
 * PATCH /api/stuff/workspace/share/reject/:id
 * Rejette une invitation.
 */
exports.rejectInvitation = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;

  try {
    const invitation = await ShareInvitation.findOne({ _id: id, to: userId, status: 'pending' });
    if (!invitation) return res.status(404).json({ message: 'Invitation introuvable.' });

    invitation.status = 'rejected';
    await invitation.save();

    res.status(200).json({ message: 'Invitation refusée.' });
  } catch {
    res.status(500).json({ message: 'Impossible de refuser l\'invitation.' });
  }
};

/**
 * GET /api/stuff/workspace/shared
 * Liste les fichiers partagés avec moi (acceptés).
 */
exports.getSharedWithMe = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const files = await WorkspaceFile.find({
      'sharedWith.userId': userId,
      isTrashed: { $ne: true },
      isDirectory: false, // N'afficher que les fichiers — les dossiers partagés incluent déjà leurs enfants
    }).sort({ updatedAt: -1 }).lean();

    const host = getHost();

    // Enrichir avec le nom du propriétaire
    const ownerIds = [...new Set(files.map(f => f.owner))];
    const owners = await User.find({ _id: { $in: ownerIds } }, 'fname lname email').lean();
    const ownerMap = Object.fromEntries(owners.map(u => [u._id.toString(), u]));

    const result = files.map(f => {
      const share = f.sharedWith.find(s => s.userId === userId);
      const urlPath = [f.owner, f.path, f.name].filter(Boolean).join('/');
      const ownerUser = ownerMap[f.owner];
      const ownerName = ownerUser ? [ownerUser.fname, ownerUser.lname].filter(Boolean).join(' ') : '';
      return {
        _id: f._id,
        name: f.name,
        url: f.isDirectory ? null : `https://${host}/api/stuff/workspace/file/${encodeURIComponent(urlPath)}`,
        createdAt: f.updatedAt || f.createdAt,
        size: f.size || 0,
        isDirectory: false, // Toujours afficher comme fichier dans l'espace partagé (pas de navigation)
        owner: f.owner,
        ownerName,
        permission: share?.permission || 'view',
        tags: f.tags || [],
        duration: f.duration || null,
        color: f.color || null,
        originalIsDirectory: f.isDirectory || false,
      };
    });

    res.status(200).json(result);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les fichiers partagés.' });
  }
};

/**
 * GET /api/stuff/workspace/share/sent
 * Liste les invitations envoyées par l'utilisateur.
 */
exports.getSentInvitations = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const invitations = await ShareInvitation.find({ from: userId })
      .sort({ createdAt: -1 })
      .lean();

    const toIds = [...new Set(invitations.map(i => i.to))];
    const users = await User.find({ _id: { $in: toIds } }, 'fname lname email imageUrl').lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const enriched = invitations.map(inv => ({
      ...inv,
      toUser: userMap[inv.to] || null,
    }));

    res.status(200).json(enriched);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les invitations envoyées.' });
  }
};

exports.createShareLink = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId } = req.body;
  if (!fileId) return res.status(400).json({ message: 'Paramètre invalide.' });
  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });
    if (!file.shareLink) {
      file.shareLink = crypto.randomBytes(16).toString('hex');
      await file.save();
    }
    res.status(200).json({ shareLink: file.shareLink });
  } catch {
    res.status(500).json({ message: 'Impossible de créer le lien de partage.' });
  }
};

exports.revokeShare = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  const { targetUserId } = req.body;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });
    if (targetUserId) {
      file.sharedWith = file.sharedWith.filter(s => s.userId !== targetUserId);
    } else {
      file.shareLink = undefined;
    }
    await file.save();
    res.status(200).json({ message: 'Partage révoqué.' });
  } catch {
    res.status(500).json({ message: 'Impossible de révoquer le partage.' });
  }
};
