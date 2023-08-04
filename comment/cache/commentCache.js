// to intially add comment data from database to cache

const redisClient = require('../../cache/redis.js');

// cache key prefixes
// to cache comments for a post
// format: 'comment:post:postid'
const COMMENT_POST_KEY_BASE = 'comment:post';

// to cache comments for a thread
// format: 'comment:thread:threadid'
const COMMENT_THREAD_KEY_BASE = 'comment:thread';

// expiration time for comments cache (1 hour for all) - (cache is updated)
const EXPIRATION_TIME = 60 * 60;

// to retrieve a single comment from cache
function getCommentFromCache(key, commentId) {
    if (!redisClient.isReady) {
        return null;
    }

    return redisClient.json.get(key, {
        path: getCommentIdPath(commentId)
    });
}

// to store comment data from database in cache
function cacheComments(comments, key) {
    // add comments and array of comment ids to cache and set expiry
    return Promise.all([
        redisClient.json.set(key, '$', comments),
        redisClient.expire(key, EXPIRATION_TIME)
    ]);
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
    return `$[?(@.creator_id._id=="${userId}")]`;
}

module.exports = {
    getCommentFromCache,
    cacheComments,
    getThreadCommentKey,
    getPostCommentKey,
    getCommentIdPath,
    getCommentByUserPath
}