// to delete thread from cache

const redisClient = require('../redis.js');
const Thread = require('../../models/thread.js');

const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');
const { getThreadCommentKey } = require('../comments/commentCache.js');
const { deleteAllCachedComments } = require('../comments/commentDeleteCache.js');

// to delete thread from cache and database
function deleteCachedThread(key, threadIndex, threadId) {
    const threadIdKey = getIndexKey(key);

    // remove thread entry and associated comments from cache and database
    return Promise.all([
        redisClient.json.arrPop(key, '$', threadIndex),
        redisClient.json.arrPop(threadIdKey, '$', threadIndex),
        Thread.findByIdAndDelete(threadId),
        deleteAllCachedComments(getThreadCommentKey(threadId))
    ]);
}

module.exports = {
    deleteCachedThread
}