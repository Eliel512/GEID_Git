const mongoose = require('mongoose');
const { Schema } = mongoose;

const workspaceFileSchema = new Schema({
  name:         { type: String, required: true },
  owner:        { type: String, required: true, index: true },
  path:         { type: String, default: '' },
  isDirectory:  { type: Boolean, default: false },
  format:       { type: String },
  size:         { type: Number, default: 0 },
  mimeType:     { type: String },
  contentUrl:   { type: String },
  duration:     { type: String },
  durationSeconds: { type: Number },
  videoWidth:   { type: Number },
  videoHeight:  { type: Number },

  // Metadata formulaire
  designation:  { type: String },
  docType:      { type: String },
  docSubType:   { type: String },

  // Drive features
  isFavorite:   { type: Boolean, default: false, index: true },
  isTrashed:    { type: Boolean, default: false, index: true },
  trashedAt:    { type: Date },
  trashContentUrl: { type: String },
  originalSize: { type: Number },
  tags:         { type: [String], default: [] },
  color:        { type: String },

  // Sharing
  sharedWith: [{
    userId:     { type: String },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
  }],
  shareLink:    { type: String },

  // Metadata
  lastAccessedAt: { type: Date },
  description:    { type: String },
}, { timestamps: true });

// Full-text search index
workspaceFileSchema.index(
  { name: 'text', tags: 'text', description: 'text' },
  { weights: { name: 10, tags: 5, description: 1 } }
);

// Compound index for fast listing
workspaceFileSchema.index({ owner: 1, path: 1, isTrashed: 1 });

// Index for recent files
workspaceFileSchema.index({ owner: 1, lastAccessedAt: -1 });

// Index for favorites
workspaceFileSchema.index({ owner: 1, isFavorite: 1 });

module.exports = mongoose.model('WorkspaceFile', workspaceFileSchema);
