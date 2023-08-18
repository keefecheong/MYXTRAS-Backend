// to add thread data from database to the cache

const redisClient = require("../../cache/redis.js");
const {
  storeDetailsMany,
  retrieveDetailsMany,
  retrieveDetailsSingle,
} = require("../../user/utils/userDetailsCacheUtil.js");

// cache key prefixes
// to cache threads grouped by parent forum id
// format: 'thread:forum:forumid'
const THREAD_FORUM_KEY_BASE = "thread:forum";

// to cache aggregated threads grouped by tags
// format: 'thread:popular:tag1-tag2'
const THREAD_POPULAR_KEY_BASE = "thread:popular";

// expiration times for thread cache
// 1 hour for threads cached by forum id (cache is updated)
const THREAD_FORUM_EXPIRATION_TIME = 60 * 60;

// 15 seconds for threads cached by tags (by aggregation) - (cache is not updated)
const THREAD_POPULAR_EXPIRATION_TIME = 15;

// to retrieve a single thread from cache if exists
async function getOneThreadFromCache(forumId, threadId) {
  if (!redisClient.isReady) {
    return null;
  }

  const thread = await redisClient.json.get(getForumThreadKey(forumId), {
    path: getThreadIdPath(threadId),
  });

  return await retrieveDetailsSingle(thread);
}

// to store thread data from database in cache
function cacheThreads(threads, key, popularType) {
  // check if cache entry is for storing by forum or by tags
  const byForum = key.startsWith(THREAD_FORUM_KEY_BASE);

  let promises = [];

  if (byForum) {
    const { workingData, creatorDetailsPromises } = storeDetailsMany(threads);

    promises = [
      redisClient.json.set(key, "$", workingData),
      redisClient.expire(key, THREAD_FORUM_EXPIRATION_TIME),
    ].concat(creatorDetailsPromises);
  } else {
    promises = [
      redisClient.json.set(key, "$", threads, {
        // for popular route (6 threads max) only set cache if cache entry does not exist
        // prevent overwriting threads retrieved from explore
        NX: !byForum && popularType == "popular",
      }),
      redisClient.expire(key, THREAD_POPULAR_EXPIRATION_TIME),
    ];
  }

  return Promise.all(promises);
}

// to retrieve threads under a forum from cache if exists
async function getThreadsFromCache(key) {
  if (!redisClient.isReady || !key.startsWith(THREAD_FORUM_KEY_BASE)) {
    return null;
  }

  const threads = await redisClient.json.get(key);

  return await retrieveDetailsMany(threads);
}

// to get cache keys
function getForumThreadKey(forumId) {
  return `${THREAD_FORUM_KEY_BASE}:${forumId}`;
}

function getPopularThreadKey(tags) {
  return `${THREAD_POPULAR_KEY_BASE}:${tags}`;
}

// to get path for a thread id
function getThreadIdPath(threadId) {
  return `$[?(@._id=="${threadId}")]`;
}

// get path for threads created by a user
function getThreadByUserPath(userId) {
  return `$[?(@.creator_id=="${userId}" || @.creator_id._id=="${userId}")]`;
}

// get path for likes by a user
function getThreadLikesPath(userId, specificLike) {
  const likesPath = `.likes[?(@=="${userId}")]`;
  return `$[?(@${likesPath})]${specificLike ? likesPath : ""}`;
}

// get path for dislikes by a user
function getThreadDislikesPath(userId, specificDislike) {
  const dislikesPath = `.dislikes[?(@=="${userId}")]`;
  return `$[?(@${dislikesPath})]${specificDislike ? dislikesPath : ""}`;
}

module.exports = {
  THREAD_FORUM_KEY_BASE,
  getOneThreadFromCache,
  cacheThreads,
  getThreadsFromCache,
  getForumThreadKey,
  getPopularThreadKey,
  getThreadIdPath,
  getThreadByUserPath,
  getThreadLikesPath,
  getThreadDislikesPath,
};
