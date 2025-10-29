// @ts-check

/** @typedef {import("mongoose").Types.ObjectId} ObjectId */

/**
 * @typedef {Object} GuestUser
 * @property {string | ObjectId} _id
 * @property {string} name
 * @property {string} [imageUrl]
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

/**
 * @typedef {import("mongoose").Document & GuestUser} GuestUserDocument
 */
