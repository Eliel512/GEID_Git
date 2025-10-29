const mongoose = require("mongoose");
const CallSession = require("../../../../models/chats/callSession.model");

/**
 * @typedef {{ participants: (Participant & { identity: User|Guest })[] & CallSession, createdBy: User }} CallSessionWithResolved
 */

/**
 * Récupère une CallSession avec participants et createdBy peuplés
 * @param {string} sessionId
 * @returns {Promise<CallSessionWithResolved}>}
 */
const getResolvedCallSession = async (sessionId) => {
  const res = await CallSession.aggregate([
    { $match: { _id: sessionId } },
    { $unwind: "$participants" },

    // identityToMatch pour participants
    {
      $addFields: {
        identityToMatch: {
          $cond: [
            { $eq: ["$participants.itemModel", "users"] },
            { $toObjectId: "$participants.identity" },
            {
              $cond: [
                { $eq: [{ $type: "$participants.identity" }, "string"] },
                { $toObjectId: "$participants.identity" },
                "$participants.identity._id",
              ],
            },
          ],
        },
        // createdByToMatch
        createdByToMatch: { $toObjectId: "$createdBy" },
      },
    },

    // Lookup Users pour participants
    {
      $lookup: {
        from: "users",
        let: { id: "$identityToMatch" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          {
            $project: {
              _id: 1,
              fname: 1,
              mname: 1,
              lname: 1,
              email: 1,
              grade: 1,
              imageUrl: 1,
            },
          },
        ],
        as: "userDoc",
      },
    },

    // Lookup Guests pour participants
    {
      $lookup: {
        from: "guests",
        let: { id: "$identityToMatch" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          { $project: { _id: 1, name: 1, imageUrl: 1 } },
        ],
        as: "guestDoc",
      },
    },

    // Lookup Users pour createdBy
    {
      $lookup: {
        from: "users",
        let: { id: "$createdByToMatch" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          {
            $project: {
              _id: 1,
              fname: 1,
              mname: 1,
              lname: 1,
              email: 1,
              grade: 1,
              imageUrl: 1,
            },
          },
        ],
        as: "createdByDoc",
      },
    },

    // Remplacer identity des participants et createdBy
    {
      $addFields: {
        "participants.identity": {
          $cond: [
            { $gt: [{ $size: "$userDoc" }, 0] },
            { $arrayElemAt: ["$userDoc", 0] },
            { $arrayElemAt: ["$guestDoc", 0] },
          ],
        },
        createdBy: { $arrayElemAt: ["$createdByDoc", 0] },
      },
    },

    // Nettoyage
    {
      $project: {
        userDoc: 0,
        guestDoc: 0,
        createdByDoc: 0,
        identityToMatch: 0,
        createdByToMatch: 0,
      },
    },

    // Regrouper les participants
    {
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
        participants: { $push: "$participants" },
      },
    },

    // Réinjecter participants
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ["$doc", { participants: "$participants" }] },
      },
    },
  ]);

  return res[0] || null;
};

module.exports = getResolvedCallSession;
