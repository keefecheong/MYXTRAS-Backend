// to delete forum entry from cache

const redisClient = require("../../cache/redis.js");

const {
  FORUM_SINGLE_KEY_BASE,
  getForumKey,
  getCreatedForumKey,
  getForumIdPath,
} = require("./forumCache.js");
const { cachedForumRemoveSubscriber } = require("./forumSubscribeCache.js");
const { getForumThreadKey } = require("../../thread/cache/threadCache.js");
const {
  deleteCachedThread,
} = require("../../thread/cache/threadDeleteCache.js");
const {
  cachedThreadRemoveLikeByUser,
} = require("../../thread/cache/threadLikeCache.js");
const {
  cachedThreadRemoveDislikeByUser,
} = require("../../thread/cache/threadDislikeCache.js");
const {
  deleteAllCachedComments,
} = require("../../comment/cache/commentDeleteCache.js");

const { PARENT_MODEL_THREAD } = require("../../comment/models/comment.js");

const compareId = require("../../utils/general/compareId.js");

// to delete forum entry from cache
async function deleteCachedForum(forumId, userId) {
  if (!redisClient.isReady) {
    return [];
  }

  const forumKey = getForumKey(forumId);
  const createdKey = getCreatedForumKey(userId);

  var promises = [redisClient.json.del(forumKey, "$")];

  // if forum:created entry exists, delete the associated information
  promises.push(redisClient.json.del(createdKey, getForumIdPath(forumId)));

  // delete all associated threads and comments
  const threadKey = getForumThreadKey(forumId);

  const threadIds = await redisClient.json.get(threadKey, {
    path: "$.*._id",
  });

  promises = promises.concat(
    threadIds.map((threadId) =>
      deleteAllCachedComments(threadId, PARENT_MODEL_THREAD),
    ),
  );

  promises.push(redisClient.json.del(threadKey, "$"));

  return promises;
}

// delete all created forums when a user is terminated
async function deleteCachedForumsOnTerminate(userId) {
  const promises = [];

  for await (const key of redisClient.scanIterator({
    MATCH: `${FORUM_SINGLE_KEY_BASE}:*`,
  })) {
    const ids = await redisClient.json.get(key, {
      path: '$["_id", "creator_id"]',
    });
    const forumId = ids[0];
    const targetUserId = ids[1];

    if (compareId(targetUserId, userId)) {
      // deleted terminated user's forums and associated threads and comments
      promises.push(...(await deleteCachedForum(forumId, targetUserId)));
    } else {
      // remove subscribe by terminated user on other users' forums
      promises.push(cachedForumRemoveSubscriber(forumId, userId, true));

      // delete all created threads
      promises.push(...deleteCachedThread(forumId, null, userId));

      // remove likes and dislikes from other users' threads
      promises.push(cachedThreadRemoveLikeByUser(forumId, userId));
      promises.push(cachedThreadRemoveDislikeByUser(forumId, userId));
    }
  }

  return promises;
}

module.exports = {
  deleteCachedForum,
  deleteCachedForumsOnTerminate,
};
