// to update cached posts when like is added/removed

const redisClient = require('../redis.js');
const { getUserPostKey, getPostIdPath, getPostLikesPath } = require('./postCache.js');
const returnPromiseResult = require('../../utils/general/returnPromiseResult.js');

// to add like to post in cache
async function cachedPostAddLike(creatorId, postId, userId) {
    if (!redisClient.isReady) {
        return false;
    }

    const postKey = getUserPostKey(creatorId);
    const postPath = getPostIdPath(postId);

    const promises = [
        redisClient.json.arrAppend(postKey, `${postPath}.likes`, userId),
        redisClient.json.numIncrBy(postKey, `${postPath}.__v`, 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove like from post in cache
async function cachedPostRemoveLike(creatorId, postId, likeIndex) {
    if (!redisClient.isReady) {
        return false;
    }

    const postKey = getUserPostKey(creatorId);
    const postPath = getPostIdPath(postId);

    const promises = [
        redisClient.json.arrPop(postKey, `${postPath}.likes`, likeIndex),
        redisClient.json.numIncrBy(postKey, `${postPath}.__v`, 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove likes from all posts under a root post key in cache
function cachedPostRemoveLikeByUser(creatorId, ownerId) {
    if (!redisClient.isReady) {
        return;
    }

    const postKey = getUserPostKey(ownerId);
    return redisClient.json.del(postKey, getPostLikesPath(creatorId, true));
}

module.exports = {
    cachedPostAddLike,
    cachedPostRemoveLike,
    cachedPostRemoveLikeByUser
}