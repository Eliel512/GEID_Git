// @ts-check
///<reference path="./user.type.js" />

/**
 * @typedef {User & {_id: string}} ChatPopulatedMember
 */

/**
 * @typedef {"direct"|"room"} ChatType
 */

/**
 * @typedef {"admin"|"simple"} MemberRole
 */

/**
 * @typedef {Object} ChatMember
 * @property {ChatPopulatedMember} _id
 * @property {MemberRole} role
 */

/**
 * @typedef {Object} Chat
 * @property {string} [createdBy]
 * @property {ChatType} type
 * @property {string} [name]
 * @property {string} [description]
 * @property {ChatMember[]} members
 * @property {string[]} [messages]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {import("mongoose").Document & Chat} ChatDocument
 */
