// to initially add post data from the database to the cache

const redisClient = require("../../cache/redis.js");
const {
  storeDetailsSingle,
  retrieveDetailsSingle,
} = require("../../user/utils/userDetailsCacheUtil.js");

// cache key prefixes
// to cache posts grouped by user id
// format: 'post:user:userid'
const POST_USER_KEY_BASE = "post:user";

// to cache aggregated posts grouped by tags
// format: 'post:popular:tag1-tag2'
const POST_POPULAR_KEY_BASE = "post:popular";

// expiration times for posts cache
// 1 hour for posts cached by creator id (cache is updated)
const POST_USER_EXPIRATION_TIME = 60 * 60;

// 1 minute for posts cached by tags (by aggregation to get popular posts) - (cache not updated)
const POST_POPULAR_EXPIRATION_TIME = 60;

// to retrieve a single post from cache if exists
async function getOnePostFromCache(userId, postId) {
  if (!redisClient.isReady) {
    return null;
  }

  const post = await redisClient.json.get(getUserPostKey(userId), {
    path: getPostIdPath(postId),
  });

  return await retrieveDetailsSingle(post);
}

// retrieve posts for a key from cache if exists
async function getPostsFromCache(key) {
  if (!redisClient.isReady) {
    return null;
  }

  const posts = await redisClient.json.get(key);

  return await retrieveDetailsSingle(posts);
}

// to store post data from database in cache
function cachePosts(posts, key) {
  // check if cache entry is for storing by user or by tags
  const byUser = key.startsWith(POST_USER_KEY_BASE);

  let promises;

  if (byUser) {
    const { workingData, creatorDetailsPromises } = storeDetailsSingle(posts);

    promises = [
      redisClient.json.set(key, "$", workingData),
      redisClient.expire(key, POST_USER_EXPIRATION_TIME),
    ].concat(creatorDetailsPromises);
  } else {
    promises = [
      redisClient.json.set(key, "$", posts),
      redisClient.expire(key, POST_POPULAR_EXPIRATION_TIME),
    ];
  }

  return Promise.all(promises);
}

// to get cache keys
function getUserPostKey(userId) {
  return `${POST_USER_KEY_BASE}:${userId}`;
}

function getPopularPostKey(tags) {
  return `${POST_POPULAR_KEY_BASE}:${tags}`;
}

// to get path for a post id
function getPostIdPath(postId) {
  return `$[?(@._id=="${postId}")]`;
}

// get path for likes by a user
function getPostLikesPath(userId, specificLike) {
  const likesPath = `.likes[?(@=="${userId}")]`;
  return `$[?(@${likesPath})]${specificLike ? likesPath : ""}`;
}

// get path for saved_by
function getPostSavesPath(userId, specificSave) {
  const savesPath = `.saved_by[?(@=="${userId}")]`;
  return `$[?(@${savesPath})]${specificSave ? savesPath : ""}`;
}

module.exports = {
  POST_USER_KEY_BASE,
  cachePosts,
  getPostsFromCache,
  getOnePostFromCache,
  getUserPostKey,
  getPopularPostKey,
  getPostIdPath,
  getPostLikesPath,
  getPostSavesPath,
};
