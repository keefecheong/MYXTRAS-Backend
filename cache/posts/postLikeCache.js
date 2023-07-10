// to update cached posts when like is added/removed

const redisClient = require('../redis.js');

// to add like to post in cache and save post asynchronously to database
async function cachedPostAddLike(key, postIndex, userId, post) {
    await Promise.all([
        redisClient.json.arrAppend(key, `$[${postIndex}].likes`, userId),
        redisClient.json.numIncrBy(key, `$[${postIndex}].__v`, 1)
    ]);

    post.save().catch(error => console.log(error));
}

// to remove like from post in cache and save post asynchronously to database
async function cachedPostRemoveLike(key, postIndex, likeIndex, post) {
    await Promise.all([
        redisClient.json.arrPop(key, `$[${postIndex}].likes`, likeIndex),
        redisClient.json.numIncrBy(key, `$[${postIndex}].__v`, 1)
    ]);

    post.save().catch(error => console.log(error));
}

module.exports = {
    cachedPostAddLike,
    cachedPostRemoveLike
}