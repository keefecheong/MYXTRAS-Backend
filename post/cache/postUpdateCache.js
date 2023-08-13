// functions to add new post to cache/update existing post in cache

const redisClient = require("../../cache/redis.js");
const { getUserPostKey, getPostIdPath } = require("./postCache.js");
const returnPromiseResult = require("../../utils/general/returnPromiseResult.js");

// to add new post to cache if parent key already exists
async function cacheNewPost(post, userDetails) {
  if (!redisClient.isReady) {
    return false;
  }

  const postKey = getUserPostKey(post.creator_id);

  // check if key exists
  const keyExists = await redisClient.exists(postKey);

  // if key does not exist in cache then return
  if (!keyExists) {
    return false;
  }

  const jsonPost = post.toObject();
  jsonPost.creator_id = userDetails;

  // add post (prepend)
  return await returnPromiseResult(
    redisClient.json.arrInsert(postKey, "$", 0, jsonPost),
  );
}

// to update post data in cache if exists
async function updateCachedPost(
  updatedValues,
  creatorId,
  postId,
  postFromCache,
) {
  if (!redisClient.isReady || !postFromCache) {
    return false;
  }

  const postKey = getUserPostKey(creatorId);
  const postPath = getPostIdPath(postId);

  // increase version key
  const promises = [redisClient.json.numIncrBy(postKey, `${postPath}.__v`, 1)];

  // add promise for each updated key/value
  for (const updatedKey in updatedValues) {
    if (updatedValues.hasOwnProperty(updatedKey)) {
      promises.push(
        redisClient.json.set(
          postKey,
          `${postPath}.${updatedKey}`,
          updatedValues[updatedKey],
        ),
      );
    }
  }

  // update cache
  return await returnPromiseResult(promises);
}

module.exports = {
  cacheNewPost,
  updateCachedPost,
};
