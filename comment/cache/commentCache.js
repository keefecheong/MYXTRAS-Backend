// to intially add comment data from database to cache

const redisClient = require("../../cache/redis.js");
const {
  storeDetailsMany,
  retrieveDetailsMany,
  retrieveDetailsSingle,
} = require("../../user/utils/userDetailsCacheUtil.js");

// cache key prefixes
// to cache comments for a post
// format: 'comment:post:postid'
const COMMENT_POST_KEY_BASE = "comment:post";

// to cache comments for a thread
// format: 'comment:thread:threadid'
const COMMENT_THREAD_KEY_BASE = "comment:thread";

// expiration time for comments cache (1 hour for all) - (cache is updated)
const EXPIRATION_TIME = 60 * 60;

// to retrieve a single comment from cache
async function getOneCommentFromCache(key, commentId) {
  if (!redisClient.isReady) {
    return null;
  }

  const comment = await redisClient.json.get(key, {
    path: getCommentIdPath(commentId),
  });

  return await retrieveDetailsSingle(comment);
}

// to retrieve multiple comments from cache
async function getCommentsFromCache(key) {
  if (!redisClient.isReady) {
    return null;
  }

  const comments = await redisClient.json.get(key);

  return await retrieveDetailsMany(comments);
}

// to store comment data from database in cache
function cacheComments(comments, key) {
  const { workingData, creatorDetailsPromises } = storeDetailsMany(comments);

  const promises = [
    redisClient.json.set(key, "$", workingData),
    redisClient.expire(key, EXPIRATION_TIME),
  ].concat(creatorDetailsPromises);

  // add comments and array of comment ids to cache and set expiry
  return Promise.all(promises);
}

// to get cache keys
function getThreadCommentKey(threadId) {
  return `${COMMENT_THREAD_KEY_BASE}:${threadId}`;
}

function getPostCommentKey(postId) {
  return `${COMMENT_POST_KEY_BASE}:${postId}`;
}

// to get path for the given comment id
function getCommentIdPath(commentId) {
  return `$[?(@._id=="${commentId}")]`;
}

// to get path for comments by a user
function getCommentByUserPath(userId) {
  return `$[?(@.creator_id=="${userId}" || @.creator_id._id=="${userId}")]`;
}

module.exports = {
  COMMENT_POST_KEY_BASE,
  COMMENT_THREAD_KEY_BASE,
  getOneCommentFromCache,
  getCommentsFromCache,
  cacheComments,
  getThreadCommentKey,
  getPostCommentKey,
  getCommentIdPath,
  getCommentByUserPath,
};
