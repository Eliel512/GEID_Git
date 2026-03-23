const mongoose = require('mongoose');
const { Schema } = mongoose;

const activityLogSchema = new Schema({
  userId:     { type: String, required: true, index: true },
  action:     {
    type: String,
    enum: ['create', 'delete', 'rename', 'move', 'copy', 'restore', 'share', 'tag', 'favorite', 'trash', 'upload'],
    required: true,
  },
  targetId:   { type: Schema.Types.ObjectId, ref: 'WorkspaceFile' },
  targetName: { type: String },
  details:    { type: Schema.Types.Mixed },
}, { timestamps: true });

// Index for fetching recent activity
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceActivityLog', activityLogSchema);
