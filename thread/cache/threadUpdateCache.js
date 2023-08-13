// functions to add new thread to cache/update existing thread in cache

const redisClient = require("../../cache/redis.js");
const { getForumThreadKey, getThreadIdPath } = require("./threadCache.js");
const returnPromiseResult = require("../../utils/general/returnPromiseResult.js");

// to add new thread to cache if parent key already exists
async function cacheNewThread(thread, userDetails, forumDetails) {
  if (!redisClient.isReady) {
    return false;
  }

  const forumThreadKey = getForumThreadKey(thread.parent_id);

  // check if key exists
  const keyExists = await redisClient.exists(forumThreadKey);

  // if key does not exist then return
  if (!keyExists) {
    return false;
  }

  // update thread details
  const jsonThread = thread.toObject();
  jsonThread.creator_id = userDetails;
  jsonThread.parent_id = forumDetails;

  return await returnPromiseResult(
    redisClient.json.arrInsert(forumThreadKey, "$", 0, jsonThread),
  );
}

// to update thread data in cache if exists
async function updateCachedThread(
  updatedValues,
  forumId,
  threadId,
  threadFromCache,
) {
  if (!redisClient.isReady || !threadFromCache) {
    return false;
  }

  const forumThreadKey = getForumThreadKey(forumId);
  const threadPath = getThreadIdPath(threadId);

  // increase version key
  const promises = [
    redisClient.json.numIncrBy(forumThreadKey, `${threadPath}.__v`, 1),
  ];

  // add promise for each updated key/value
  for (const updatedKey in updatedValues) {
    if (updatedValues.hasOwnProperty(updatedKey)) {
      promises.push(
        redisClient.json.set(
          forumThreadKey,
          `${threadPath}.${updatedKey}`,
          updatedValues[updatedKey],
        ),
      );
    }
  }

  // update thread
  return await returnPromiseResult(promises);
}

module.exports = {
  cacheNewThread,
  updateCachedThread,
};
