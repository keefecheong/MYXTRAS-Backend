// to add new comment to cache if parent key is present

const redisClient = require('../redis.js');
const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');

// to add a new comment to cache if parent key already exists
async function cacheNewComment(comment, key, jsonComment, parentInCache, parentKey, parentIndex) {
    // check if key exists
    const keyExists = await redisClient.exists(key);

    // if key does not exist in cache then update database immediately
    if (!keyExists) {
        await comment.save();
        return;
    }

    const commentIdKey = getIndexKey(key);

    // add comment and update comment id array (prepend)
    const promises = [
        redisClient.json.arrInsert(key, '$', 0, jsonComment),
        redisClient.json.arrInsert(commentIdKey, '$', 0, jsonComment._id)
    ];

    // if parent object is in cache then update parent's comment_count value
    if (parentInCache) {
        promises.push(redisClient.json.numIncrBy(parentKey, `$[${parentIndex}].comment_count`, 1));
    }

    await Promise.all(promises);

    // asynchronously save comment
    comment.save().catch(error => console.log(error));
}

module.exports = {
    cacheNewComment
}