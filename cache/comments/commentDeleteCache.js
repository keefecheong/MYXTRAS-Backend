// to delete cache entry if comment is present in cache

const redisClient = require('../redis.js');
const Comment = require('../../models/comment.js');

const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');

// to delete a comment from cache and database
function deleteCachedComment(key, commentIndex, commentId, parentInCache, parentKey, parentIndex) {
    const commentIdKey = getIndexKey(key);

    // remove comment from cache and database
    const promises = [
        redisClient.json.arrPop(key, '$', commentIndex),
        redisClient.json.arrPop(commentIdKey, '$', commentIndex),
        Comment.findByIdAndDelete(commentId)
    ];

    // if parent object is in cache then update parent object's comment_count value
    if (parentInCache) {
        promises.push(redisClient.json.numIncrBy(parentKey, `$[${parentIndex}].comment_count`, -1));
    }

    return Promise.all(promises);
}

// to delete all comments from cache for a specified key
function deleteAllCachedComments(key) {
    const commentIdKey = getIndexKey(key);

    return Promise.all([
        redisClient.json.del(key, '$'),
        redisClient.json.del(commentIdKey, '$')
    ]);
}

module.exports = {
    deleteCachedComment,
    deleteAllCachedComments
}