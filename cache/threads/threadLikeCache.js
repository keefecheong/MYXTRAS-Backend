// to update cached thread when like is added/removed

const redisClient = require('../redis.js');
const { getForumThreadKey, getThreadIdPath, getThreadLikesPath } = require('./threadCache.js');
const returnPromiseResult = require('../../utils/general/returnPromiseResult.js');

// to add like to thread in cache
async function cachedThreadAddLike(forumId, threadId, userId, threadFromCache) {
    if (!redisClient.isReady || !threadFromCache) {
        return false;
    }

    const forumThreadKey = getForumThreadKey(forumId);
    const threadPath = getThreadIdPath(threadId);

    const promises = [
        redisClient.json.arrAppend(forumThreadKey, `${threadPath}.likes`, userId),
        redisClient.json.numIncrBy(forumThreadKey, `${threadPath}.__v`, 1)
    ];
    
    return await returnPromiseResult(promises);
}

// to remove like from thread in cache
async function cachedThreadRemoveLike(forumId, threadId, likeIndex, threadFromCache) {
    if (!redisClient.isReady || !threadFromCache) {
        return false;
    }

    const forumThreadKey = getForumThreadKey(forumId);
    const threadPath = getThreadIdPath(threadId);

    const promises = [
        redisClient.json.arrPop(forumThreadKey, `${threadPath}.likes`, likeIndex),
        redisClient.json.numIncrBy(forumThreadKey, `${threadPath}.__v`, 1)
    ];
    
    return await returnPromiseResult(promises);
}

// to remove like by user from all threads under a forum
function cachedThreadRemoveLikeByUser(forumId, userId) {
    if (!redisClient.isReady) {
        return;
    }

    const forumThreadKey = getForumThreadKey(forumId);
    return redisClient.json.del(forumThreadKey, getThreadLikesPath(userId, true));
}

module.exports = {
    cachedThreadAddLike,
    cachedThreadRemoveLike,
    cachedThreadRemoveLikeByUser
}