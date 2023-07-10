// to update cached thread when like is added/removed

const redisClient = require('../redis.js');

// to add like to thread in cache and asynchronously update database
async function cachedThreadAddLike(key, threadIndex, userId, thread) {
    await Promise.all([
        redisClient.json.arrAppend(key, `$[${threadIndex}].likes`, userId),
        redisClient.json.numIncrBy(key, `$[${threadIndex}].__v`, 1)
    ]);

    thread.save().catch(error => console.log(error));
}

// to remove like from thread in cache and asynchronously update database
async function cachedThreadRemoveLike(key, threadIndex, likeIndex, thread) {
    await Promise.all([
        redisClient.json.arrPop(key, `$[${threadIndex}].likes`, likeIndex),
        redisClient.json.numIncrBy(key, `$[${threadIndex}].__v`, -1)
    ]);

    thread.save().catch(error => console.log(error));
}

module.exports = {
    cachedThreadAddLike,
    cachedThreadRemoveLike
}