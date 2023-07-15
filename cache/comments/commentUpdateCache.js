// to add new comment to cache if parent key is present

const redisClient = require('../redis.js');
const { getPostCommentKey, getThreadCommentKey } = require('./commentCache.js');
const { getPostIdPath } = require('../posts/postCache.js');
const { getThreadIdPath } = require('../threads/threadCache.js');
const returnPromiseResult = require('../../utils/cache/returnPromiseResult.js');

// to add a new comment to cache if parent key already exists
async function cacheNewComment(forPost, jsonComment, parentInCache, parentKey, parentId) {
    if (!redisClient.isReady) {
        return false;
    }

    const promises = [];
    
    const key = forPost ? getPostCommentKey(parentId) : getThreadCommentKey(parentId);
    
    // check if key exists
    const keyExists = await redisClient.exists(key);

    // if parent key exists then add comment (prepend to sort by creation time)
    if (keyExists) {
        promises.push(redisClient.json.arrInsert(key, '$', 0, jsonComment));
    }

    // if parent object is in cache then update parent's comment_count value
    if (parentInCache) {
        const parentPath = forPost ? getPostIdPath(parentId) : getThreadIdPath(parentId);
        promises.push(redisClient.json.numIncrBy(parentKey, `${parentPath}.comment_count`, 1));
    }

    if (promises.length <= 0) {
        return false;
    }

    return await returnPromiseResult(promises);
}

module.exports = {
    cacheNewComment
}