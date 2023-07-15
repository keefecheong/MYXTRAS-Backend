// to update cached user when a post is saved/unsaved

const redisClient = require('../redis.js');

const { getUserKey } = require('../users/userCache.js');
const returnPromiseResult = require('../../utils/cache/returnPromiseResult.js');

// to add a saved post to user in cache
async function cachedUserSavePost(user, entry) {
    if (!redisClient.isReady) {
        return false;
    }

    const key = getUserKey(user._id);

    const promises = [
        redisClient.json.arrAppend(key, '$.saved_posts', entry),
        redisClient.json.numIncrBy(key, '$.__v', 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove a saved post from user in cache
async function cachedUserRemoveSavedPost(user, saveIndex) {
    if (!redisClient.isReady) {
        return false;
    }

    const key = getUserKey(user._id);

    const promises = [
        redisClient.json.arrPop(key, '$.saved_posts', saveIndex),
        redisClient.json.numIncrBy(key, '$.__v', 1)
    ];

    return await returnPromiseResult(promises);
}

module.exports = {
    cachedUserSavePost,
    cachedUserRemoveSavedPost
}