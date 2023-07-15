// to delete cache entry if comment is present in cache

const redisClient = require('../redis.js');
const { getPostCommentKey, getThreadCommentKey } = require('./commentCache.js');
const { getPostIdPath } = require('../posts/postCache.js');
const { getThreadIdPath } = require('../threads/threadCache.js');
const { getCommentIdPath } = require('./commentCache.js');

// to delete a comment from cache
function deleteCachedComment(forPost, commentId, commentInCache, parentInCache, parentKey, parentId) {
    if (!redisClient.isReady) {
        return [];
    }

    const promises = [];
    
    // if comment is in cache then remove comment
    if (commentInCache) {
        const key = forPost ? getPostCommentKey(parentId) : getThreadCommentKey(parentId);
        promises.push(redisClient.json.del(key, getCommentIdPath(commentId)));
    }

    // if parent object is in cache then update parent object's comment_count value
    if (parentInCache) {
        const parentPath = forPost ? getPostIdPath(parentId) : getThreadIdPath(parentId);
        promises.push(redisClient.json.numIncrBy(parentKey, `${parentPath}.comment_count`, -1));
    }

    return promises;
}

// to delete all comments from cache for a specified key
function deleteAllCachedComments(key) {
    if (!redisClient.isReady) {
        return [];
    }

    return redisClient.json.del(key, '$');
}

module.exports = {
    deleteCachedComment,
    deleteAllCachedComments
}