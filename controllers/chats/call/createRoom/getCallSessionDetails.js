const User = require("../../../../models/users/user.model");
const Chat = require("../../../../models/chats/chat.model");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

/**
 * @param {string} userId
 * @param {{type: string, target: string, tokenType?: string, role?: string}} data
 * @returns {Promise<{TOKEN: string, APP_ID: string, UID: number, EXPIRE_AT: number}&{error: boolean, message: string, type: string}>}
 */
const getCallDetails = async (userId, data) => {
  const { type, target, tokenType, role = "subscriber" } = data;

  // Validation des paramètres
  if (!target) return { error: true, message: "'target' is required" };

  if (!["direct", "room"].includes(type))
    return {
      error: true,
      message: "type parameter is not valid",
      type: "invalidParam",
    };

  if (!["uid", "userAccount"].includes(tokenType))
    return {
      error: true,
      message: "'tokenType' parameter is not valid",
      type: "invalidParam",
    };

  const rtcRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  try {
    if (type === "direct") {
      const userDetails = await User.findById(userId, "contacts");
      if (!userDetails?.contacts.includes(target))
        return {
          error: true,
          message: "target user is not in your contact list",
          type: "notFound",
        };
    } else if (type === "room") {
      const roomExists = await Chat.exists({
        _id: target,
        "members._id": userId,
      });
      if (!roomExists)
        return {
          error: true,
          message: "Room does not exist",
          type: "notFound",
        };
    }
  } catch (err) {
    return {
      error: true,
      message: "Error while fetching user details or room details",
      type: "serverError",
    };
  }

  const expireTime = 3600 * 5;
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  let token;
  try {
    if (tokenType === "uid") {
      token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        target,
        0,
        rtcRole,
        privilegeExpireTime
      );
    } else {
      token = RtcTokenBuilder.buildTokenWithAccount(
        APP_ID,
        APP_CERTIFICATE,
        target,
        0,
        rtcRole,
        privilegeExpireTime
      );
    }
  } catch (err) {
    return {
      error: true,
      message: "Error while generating token",
      type: "serverError",
    };
  }

  return {
    TOKEN: token,
    APP_ID,
    UID: 0,
    EXPIRE_AT: privilegeExpireTime,
  };
};

module.exports = getCallDetails;
