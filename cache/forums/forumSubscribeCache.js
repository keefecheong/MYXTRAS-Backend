// to update cached forum when a subscriber is added/removed

const redisClient = require('../redis.js');
const { getForumKey, getForumSubscribePath } = require('./forumCache.js');
const returnPromiseResult = require('../../utils/general/returnPromiseResult.js');

// to add subscriber to forum in cache
async function cachedForumAddSubscriber(forumId, userId) {
    if (!redisClient.isReady) {
        return false;
    }

    const forumKey = getForumKey(forumId);

    const promises = [
        redisClient.json.arrAppend(forumKey, '$.subscribers', userId),
        redisClient.json.numIncrBy(forumKey, '$.__v', 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove subscriber from forum in cache
async function cachedForumRemoveSubscriber(forumId, userId, increaseVersion) {
    if (!redisClient.isReady) {
        return false;
    }

    const forumKey = getForumKey(forumId);

    const removeSubscriberPromise = redisClient.json.del(forumKey, getForumSubscribePath(userId));
    const increaseVersionPromise = redisClient.json.numIncrBy(forumKey, '$.__v', 1);

    return increaseVersion ? await returnPromiseResult([removeSubscriberPromise, increaseVersionPromise]) : removeSubscriberPromise;
}

module.exports = {
    cachedForumAddSubscriber,
    cachedForumRemoveSubscriber
}