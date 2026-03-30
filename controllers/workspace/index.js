const { getAll } = require('./getAll');
const { create } = require('./create');
const { modify } = require('./modify');
const { delete: deleteFile } = require('./delete');
const { createFolder, deleteFolder, renameFolder } = require('./folder');
const { setFolderColor } = require('./color');
const { createFolderTree } = require('./folderTree');
const { getFavorites, toggleFavorite } = require('./favorites');
const { getTrash, moveToTrash, restoreFromTrash, permanentDelete, emptyTrash } = require('./trash');
const { updateTags, getAllTags } = require('./tags');
const { search } = require('./search');
const { moveFile, copyFile } = require('./move');
const { getRecent, getRecentTags } = require('./recent');
const { getQuota } = require('./quota');
const { getActivity } = require('./activity');
const { shareWithUser, createShareLink, revokeShare, getSharedWithMe, browseSharedFolder, getInvitations, acceptInvitation, rejectInvitation, getSentInvitations } = require('./share');
const { serveFile } = require('./serveFile');
const { listUsers } = require('./listUsers');
const { serveThumbnail } = require('./serveThumbnail');
const { getVideoInfo } = require('./videoInfo');
const { touchFile } = require('./touch');
const { createStreamToken } = require('./streamToken');
const { servePreview } = require('./servePreview');

module.exports = {
  // Existing (refactored)
  getAll,
  create,
  modify,
  delete: deleteFile,
  createFolder,
  createFolderTree,
  deleteFolder,
  renameFolder,
  setFolderColor,

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
  getRecentTags,
  getQuota,
  getActivity,
  shareWithUser,
  createShareLink,
  revokeShare,
  getSharedWithMe,
  browseSharedFolder,
  getInvitations,
  acceptInvitation,
  rejectInvitation,
  getSentInvitations,
  serveFile,
  listUsers,
  serveThumbnail,
  getVideoInfo,
  touchFile,
  createStreamToken,
  servePreview,
};
