// @ts-check

/**
 * @typedef {Object} Role
 * @property {string} name
 * @property {string[]} [children]
 * @property {string} [parent]
 * @property {any[]} [docTypes]
 * @property {string[]} [management]
 */

/**
 * @typedef {import("mongoose").Document & Role} RoleDocument
 */

/**
 * @typedef {Object} Permission
 * @property {string} struct
 * @property {'read'|'write'} access
 */

/**
 * @typedef {Object} Privilege
 * @property {string} app
 * @property {Permission[]} permissions
 */

/**
 * @typedef {Object} Auth
 * @property {string} name
 * @property {Privilege[]} privileges
 * @property {string[]} [upper]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {import("mongoose").Document & Auth} AuthDocument
 */

// @ts-check

/**
 * @typedef {Object} GradeInfo
 * @property {string} grade
 * @property {string} role
 */

/**
 * @typedef {Object} User
 * @property {boolean} isValid
 * @property {Date} [connected_at]
 * @property {string} fname
 * @property {string} [mname]
 * @property {string} lname
 * @property {string} email
 * @property {string} password
 * @property {string} phoneCell
 * @property {GradeInfo} grade
 * @property {string} auth
 * @property {string[]} [contacts]
 * @property {string} [imageUrl]
 * @property {Date} joinedAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {import("mongoose").Document & User} UserDocument
 */
