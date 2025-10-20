// @ts-check
/// <reference path="../../types/callSession.type.js" />
// const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");
/**
 * @typedef {import('socket.io').Socket} BaseSocket
 */
/**
 * @typedef {BaseSocket & { userId: string }} AuthenticatedSocket
 */
/**
 * @async
 * @param {AuthenticatedSocket} socket
 * @param {{id: string, state?: ParticipantState, auth?: ParticipantAuth}} data
 */
const queryToJoin = async (socket, data) => {};

module.exports = queryToJoin;
