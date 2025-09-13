// @ts-check

/**
 * @typedef {Object} Duration
 * @property {number} [hours]
 * @property {number} [minutes]
 * @property {number} seconds
 */

/**
 * @typedef {Object} ParticipantState
 * @property {boolean} [isOrganizer]
 * @property {boolean} handRaised
 * @property {boolean} screenShared
 * @property {boolean} [isCamActive]
 * @property {boolean} [isMicActive]
 * @property {boolean} isInRoom
 */

/**
 * @typedef {Object} ParticipantAuth
 * @property {boolean} shareScreen
 * @property {boolean} [writeMessage=true]
 * @property {boolean} [react=true]
 */

/**
 * @typedef {Object} Participant
 * @property {string} identity
 * @property {"users"|"guests"} itemModel
 * @property {number} uid
 * @property {number} [screenId]
 * @property {ParticipantState} state
 * @property {ParticipantAuth} auth
 */

/**
 * @typedef {Object} Guest
 * @property {string} identity
 * @property {"users"|"guests"} itemModel
 */

/**
 * @typedef {Object} Message
 * @property {string} content
 * @property {*} sender
 * @property {Date} createdAt
 * @property {string} [clientId]
 * @property {string} [ref]
 */

/**
 * @typedef {Object} CallSession
 * @property {string} _id
 * @property {string} [title]
 * @property {string} startedAt
 * @property {string} [endedAt]
 * @property {Duration} duration
 * @property {string} [summary]
 * @property {string} [description]
 * @property {string} createdBy
 * @property {string} location
 * @property {*} [room]
 * @property {number} status
 * @property {Participant[]} participants
 * @property {Guest} guests
 * @property {Message[]} messages
 * @property {*} callDetails
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {import("mongoose").Document & CallSession} CallSessionDocument
 */
