// to delete thread from cache

const redisClient = require('../redis.js');

const { getForumThreadKey, getThreadIdPath } = require('./threadCache.js');
const { getThreadCommentKey } = require('../comments/commentCache.js');
const { deleteAllCachedComments } = require('../comments/commentDeleteCache.js');

// to delete thread from cache 
function deleteCachedThread(forumId, threadId) {
    if (!redisClient.isReady) {
        return [];
    }
    
    const forumThreadKey = getForumThreadKey(forumId);

    // remove thread entry and associated comments from cache
    return [
        redisClient.json.del(forumThreadKey, getThreadIdPath(threadId)),
        deleteAllCachedComments(getThreadCommentKey(threadId))
    ];
}

module.exports = {
    deleteCachedThread
}