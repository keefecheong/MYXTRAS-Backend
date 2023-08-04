// to delete thread from cache

const redisClient = require('../../cache/redis.js');

const { getForumThreadKey, getThreadIdPath, getThreadByUserPath } = require('./threadCache.js');
const { deleteAllCachedComments } = require('../../comment/cache/commentDeleteCache.js');
const { PARENT_MODEL_THREAD } = require('../../comment/models/comment.js');

// to delete thread from cache 
function deleteCachedThread(forumId, threadId, userId) {
    if (!redisClient.isReady) {
        return [];
    }
    
    const forumThreadKey = getForumThreadKey(forumId);

    let path;

    if (threadId) {
        path = getThreadIdPath(threadId);
    }
    else if (userId) {
        path = getThreadByUserPath(userId);
    }

    // remove thread entry and associated comments from cache
    return [
        redisClient.json.del(forumThreadKey, path),
        deleteAllCachedComments(threadId, PARENT_MODEL_THREAD)
    ];
}

module.exports = {
    deleteCachedThread
}