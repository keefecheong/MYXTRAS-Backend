// to update cached thread when dislike is added/removed

const redisClient = require('../redis.js');

// to add dislike to thread in cache and asynchronously update database
async function cachedThreadAddDislike(key, threadIndex, userId, thread) {
    await Promise.all([
        redisClient.json.arrAppend(key, `$[${threadIndex}].dislikes`, userId),
        redisClient.json.numIncrBy(key, `$[${threadIndex}].__v`, 1)
    ]);

    thread.save().catch(error => console.log(error));
}

// to remove dislike from thread in cache and asynchronously update database
async function cachedThreadRemoveDislike(key, threadIndex, dislikeIndex, thread) {
    await Promise.all([
        redisClient.json.arrPop(key, `$[${threadIndex}].dislikes`, dislikeIndex),
        redisClient.json.numIncrBy(key, `$[${threadIndex}].__v`, -1)
    ]);

    thread.save().catch(error => console.log(error));
}

module.exports = {
    cachedThreadAddDislike,
    cachedThreadRemoveDislike
}