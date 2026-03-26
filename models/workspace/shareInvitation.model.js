const mongoose = require('mongoose');
const { Schema } = mongoose;

const shareInvitationSchema = new Schema({
  /** Utilisateur qui partage */
  from: { type: String, required: true, index: true },
  /** Utilisateur destinataire */
  to: { type: String, required: true, index: true },
  /** Fichier ou dossier partagé */
  fileId: { type: Schema.Types.ObjectId, ref: 'WorkspaceFile', required: true },
  /** Nom du fichier (copie pour affichage rapide) */
  fileName: { type: String },
  /** Est-ce un dossier */
  isDirectory: { type: Boolean, default: false },
  /** Permission accordée */
  permission: { type: String, enum: ['view', 'edit'], default: 'view' },
  /** Statut de l'invitation */
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  /** Message optionnel */
  message: { type: String },
}, { timestamps: true });

shareInvitationSchema.index({ to: 1, status: 1 });
shareInvitationSchema.index({ from: 1 });

module.exports = mongoose.model('ShareInvitation', shareInvitationSchema);
