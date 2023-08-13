// to block/unblock a user

const { User } = require("../models/user.js");
const Post = require("../../post/models/post.js");
const { Comment } = require("../../comment/models/comment.js");
const { Unblock, UNBLOCK_TTL } = require("../models/unblock.js");

const compareId = require("../../utils/general/compareId.js");
const calcTimeDifference = require("../../utils/general/calcTimeDifference.js");
const { handleBlockPerUser } = require("../utils/blockUserFunctions.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq");

const { cachedUserRemoveBlocked } = require("../cache/userBlockCache.js");
const { cacheUnblock } = require("../cache/unblockCache.js");

// to block a user
async function blockUser(req, res) {
  var self = req.user;
  var targetUser = res.user;

  if (compareId(self._id, targetUser._id)) {
    return returnBadReq(res, "You cannot block yourself.");
  }

  if (
    self.blocked_users.some((entry) => compareId(entry.user_id, targetUser._id))
  ) {
    return returnBadReq(res, "You have already blocked this user.");
  }

  try {
    const recentUnblock = await Unblock.findOne(
      { blocker_id: self._id, blocked_id: targetUser._id },
      { unblock_time: 1 },
    ).cache();

    // if recentUnblock document exists for this set of users means the minimum time before reblocking has not passed
    if (recentUnblock) {
      return returnBadReq(
        res,
        `User can be blocked again in ${calcTimeDifference(
          recentUnblock.unblock_time,
          UNBLOCK_TTL,
        )}.`,
      );
    }

    // handle blocking for both self and target user
    const results = await Promise.all([
      handleBlockPerUser(self, targetUser._id, true),
      handleBlockPerUser(targetUser, self._id, false),
    ]);

    const selfHandleBlock = results[0];
    const targetHandleBlock = results[1];

    // craft promises to update database for users, posts and comments
    const promises = [
      selfHandleBlock.cachePromises,
      targetHandleBlock.cachePromises,
      User.bulkSave([selfHandleBlock.user, targetHandleBlock.user]),
      Post.bulkWrite(
        selfHandleBlock.bulkUpdatePost.concat(targetHandleBlock.bulkUpdatePost),
      ),
      Comment.bulkWrite([
        selfHandleBlock.deleteComments,
        targetHandleBlock.deleteComments,
      ]),
    ];

    // update cache and database synchronously
    await Promise.all(promises);

    returnGoodReq(res, { message: "User blocked." });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// to unblock a user
async function unblockUser(req, res) {
  var self = req.user;
  var targetUser = res.user;

  if (compareId(self._id, targetUser._id)) {
    return returnBadReq(res, "You cannot unblock yourself.");
  }

  const blockIndex = self.blocked_users.findIndex((entry) =>
    compareId(entry.user_id, targetUser._id),
  );

  if (blockIndex == -1) {
    return returnBadReq(res, "You have not blocked this user.");
  }

  // check if it has been 30 minutes since block_time and only allow unblock if true
  const minInterval = UNBLOCK_TTL * 60 * 1000;
  const blockTime = self.blocked_users[blockIndex].block_time;
  const now = Date.now();

  const unblockAvailable = now - new Date(blockTime).getTime() > minInterval;

  if (!unblockAvailable) {
    return returnBadReq(
      res,
      `You can unblock this user in ${calcTimeDifference(
        blockTime,
        UNBLOCK_TTL,
      )}.`,
    );
  }

  self = new User(self);
  self.isNew = false;

  self.blocked_users.splice(blockIndex, 1);

  const unblock = new Unblock({
    blocker_id: self._id,
    blocked_id: targetUser._id,
    unblock_time: now,
  });

  try {
    // update cache and database synchronously
    const promises = [
      unblock.save(),
      self.save(),
      cachedUserRemoveBlocked(self._id, targetUser._id, true),
      cacheUnblock(unblock),
    ].flat();

    await Promise.all(promises);

    returnGoodReq(res, { message: "User unblocked." });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  blockUser,
  unblockUser,
};
