const { getAll } = require('./getAll');
const { create } = require('./create');
const { modify } = require('./modify');
const { delete: deleteFile } = require('./delete');
const { createFolder, deleteFolder, renameFolder } = require('./folder');
const { getFavorites, toggleFavorite } = require('./favorites');
const { getTrash, moveToTrash, restoreFromTrash, permanentDelete, emptyTrash } = require('./trash');
const { updateTags, getAllTags } = require('./tags');
const { search } = require('./search');
const { moveFile, copyFile } = require('./move');
const { getRecent } = require('./recent');
const { getQuota } = require('./quota');
const { getActivity } = require('./activity');
const { shareWithUser, createShareLink, revokeShare, getSharedWithMe } = require('./share');
const { serveFile } = require('./serveFile');

module.exports = {
  // Existing (refactored)
  getAll,
  create,
  modify,
  delete: deleteFile,
  createFolder,
  deleteFolder,
  renameFolder,

  // New - Drive features
  getFavorites,
  toggleFavorite,
  getTrash,
  moveToTrash,
  restoreFromTrash,
  permanentDelete,
  emptyTrash,
  updateTags,
  getAllTags,
  search,
  moveFile,
  copyFile,
  getRecent,
  getQuota,
  getActivity,
  shareWithUser,
  createShareLink,
  revokeShare,
  getSharedWithMe,
  serveFile,
};
