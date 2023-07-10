// to intially add comment data from database to cache

const redisClient = require('../redis.js');

const { getIndexKey, getIdIndex } = require('../../utils/cache/cacheIndexUtils.js');

// cache key prefixes
// to cache comments for a post
// format: 'comment:post:postid'
const COMMENT_POST_KEY_BASE = 'comment:post';

// to cache comments for a thread
// format: 'comment:thread:threadid'
const COMMENT_THREAD_KEY_BASE = 'comment:thread';

// expiration time for comments cache (1 hour for all) - (cache is updated)
const EXPIRATION_TIME = 60 * 60;

// to retrieve a single comment from cache if exists
async function getCommentFromCache(key, commentId) {
    try {
        const commentIndex = await getIdIndex(key, commentId);

        const comment = await redisClient.json.get(key, {
            path: `$[${commentIndex}]`
        });

        return { success: true, comment: comment[0], commentIndex };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}

// to store comment data from database in cache
function cacheComments(comments, key) {
    // get array of comment ids
    const commentIds = comments.map(comment => comment._id);

    // get new key value for the above array
    const commentIdKey = getIndexKey(key);

    // add comments and array of comment ids to cache and set expiry
    return Promise.all([
        redisClient.json.set(key, '$', comments),
        redisClient.json.set(commentIdKey, '$', commentIds),
        redisClient.expire(key, EXPIRATION_TIME),
        redisClient.expire(commentIdKey, EXPIRATION_TIME)
    ]);
}

// to get cache keys
function getThreadCommentKey(threadId) {
    return `${COMMENT_THREAD_KEY_BASE}:${threadId}`;
}

function getPostCommentKey(postId) {
    return `${COMMENT_POST_KEY_BASE}:${postId}`;
}

module.exports = {
    getCommentFromCache,
    cacheComments,
    getThreadCommentKey,
    getPostCommentKey
}