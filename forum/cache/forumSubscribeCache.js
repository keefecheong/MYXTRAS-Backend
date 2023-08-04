// to update cached forum when a subscriber is added/removed

const redisClient = require('../../cache/redis.js');
const { getForumKey, getForumSubscriberPath, getSubscribedForumKey, getForumIdPath } = require('./forumCache.js');
const returnPromiseResult = require('../../utils/general/returnPromiseResult.js');

// to add subscriber to forum in cache
async function cachedForumAddSubscriber(forumDetails, userId) {
    if (!redisClient.isReady) {
        return false;
    }

    const forumKey = getForumKey(forumDetails._id);

    const promises = [
        redisClient.json.arrAppend(forumKey, '$.subscribers', userId),
        redisClient.json.numIncrBy(forumKey, '$.__v', 1)
    ];

    // check if user's subscribed forums entry is in cache
    const subscribedForumKey = getSubscribedForumKey(userId);
    const subscribedEntryExists = await redisClient.exists(subscribedForumKey);

    // if subscribed forums entry is in cache then push forum details
    if (subscribedEntryExists) {
        promises.push(redisClient.json.arrAppend(subscribedForumKey, '$', forumDetails));
    }

    return await returnPromiseResult(promises);
}

// to remove subscriber from forum in cache
async function cachedForumRemoveSubscriber(forumId, userId, forTerminate) {
    if (!redisClient.isReady) {
        return false;
    }

    const forumKey = getForumKey(forumId);
    const removeSubscriberPromise = redisClient.json.del(forumKey, getForumSubscriberPath(userId));

    // if function is called while terminating user just return above promise
    if (forTerminate) return removeSubscriberPromise;

    // increase version key and update subscribed forums entry
    const increaseVersionPromise = redisClient.json.numIncrBy(forumKey, '$.__v', 1);

    const subscribedForumKey = getSubscribedForumKey(userId);
    const removeSubscribedForumPromise = redisClient.json.del(subscribedForumKey, getForumIdPath(forumId));

    return await returnPromiseResult([removeSubscriberPromise, increaseVersionPromise, removeSubscribedForumPromise]);
}

module.exports = {
    cachedForumAddSubscriber,
    cachedForumRemoveSubscriber
}