// to update cached forum when a subscriber is added/removed

const redisClient = require('../redis.js');

// to add subscriber to forum in cache and update database asynchronously
async function cachedForumAddSubscriber(key, userId, forum) {
    await Promise.all([
        redisClient.json.arrAppend(key, '$.subscribers', userId),
        redisClient.json.numIncrBy(key, '$.__v', 1)
    ]);

    forum.save().catch(error => console.log(error));
}

// to remove subscriber from forum in cache and update database asynchronously
async function cachedForumRemoveSubscriber(key, subscriberIndex, forum) {
    await Promise.all([
        redisClient.json.arrPop(key, '$.subscribers', subscriberIndex),
        redisClient.json.numIncrBy(key, '$.__v', 1)
    ]);

    forum.save().catch(error => console.log(error));
}

module.exports = {
    cachedForumAddSubscriber,
    cachedForumRemoveSubscriber
}