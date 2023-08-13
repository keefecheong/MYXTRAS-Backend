// to update cache when user is terminated

const redisClient = require("../../cache/redis.js");

const {
  USER_SINGLE_KEY_BASE,
  getFollowingKey,
  getUserIdFromKey,
} = require("./userCache.js");
const { cachedUserRemoveFollower } = require("./userFollowCache.js");
const { updateCachedUser } = require("./userUpdateCache.js");
const { cachedUserRemoveBlocked } = require("./userBlockCache.js");

const {
  deleteCachedPostsOnTerminate,
} = require("../../post/cache/postDeleteCache.js");

const {
  getCreatedForumKey,
  getSubscribedForumKey,
} = require("../../forum/cache/forumCache.js");
const {
  deleteCachedForumsOnTerminate,
} = require("../../forum/cache/forumDeleteCache.js");

const {
  deleteAllCachedComments,
  updateCachedParentCommentCount,
} = require("../../comment/cache/commentDeleteCache.js");

async function terminateCachedUser(userId, updatedValues, commentsPerParent) {
  if (!redisClient.isReady) {
    return;
  }

  // set terminated status and clear followers and blocked_users for target user
  // delete target user's following and followers entry
  // delete target user's created and subscribed forums entry
  const promises = [
    ...(await updateCachedUser(updatedValues, userId, false)),
    redisClient.json.del(getFollowingKey(userId), "$"),
    redisClient.json.del(getCreatedForumKey(userId)),
    redisClient.json.del(getSubscribedForumKey(userId)),
  ];

  await Promise.all([
    // clean up user data
    removeTerminatedUser(userId),
    // clean up post data
    deleteCachedPostsOnTerminate(userId),
    // clean up forum data
    deleteCachedForumsOnTerminate(userId),
  ]).then((results) => {
    // push all promises
    promises.push(results.flat(2));
  });

  // delete all created comments and update parent respectively
  commentsPerParent.forEach((entry) => {
    promises.push(
      deleteAllCachedComments(entry._id, entry.parent_model, userId),
    );
    promises.push(
      updateCachedParentCommentCount(
        entry.key_creation_id,
        entry._id,
        entry.parent_model,
        entry.count,
      ),
    );
  });

  return Promise.all(promises);
}

// delete target user from other users' blocked_users and followers list
async function removeTerminatedUser(userId) {
  const promises = [];

  for await (const key of redisClient.scanIterator({
    MATCH: `${USER_SINGLE_KEY_BASE}:*`,
  })) {
    const targetUserId = getUserIdFromKey(key);

    promises.push(cachedUserRemoveBlocked(targetUserId, userId, false));
    promises.push(cachedUserRemoveFollower(targetUserId, userId, false));
  }

  return promises;
}

module.exports = {
  terminateCachedUser,
};
