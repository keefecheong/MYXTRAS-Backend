// to update cached thread when dislike is added/removed

const redisClient = require('../../cache/redis.js');
const { getForumThreadKey, getThreadIdPath, getThreadDislikesPath } = require('./threadCache.js');
const returnPromiseResult = require('../../utils/general/returnPromiseResult.js');

// to add dislike to thread in cache
async function cachedThreadAddDislike(forumId, threadId, userId, threadFromCache) {
    if (!redisClient.isReady || !threadFromCache) {
        return false;
    }

    const forumThreadKey = getForumThreadKey(forumId);
    const threadPath = getThreadIdPath(threadId);

    const promises = [
        redisClient.json.arrAppend(forumThreadKey, `${threadPath}.dislikes`, userId),
        redisClient.json.numIncrBy(forumThreadKey, `${threadPath}.__v`, 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove dislike from thread in cache
async function cachedThreadRemoveDislike(forumId, threadId, dislikeIndex, threadFromCache) {
    if (!redisClient.isReady || !threadFromCache) {
        return false;
    }

    const forumThreadKey = getForumThreadKey(forumId);
    const threadPath = getThreadIdPath(threadId);

    const promises = [
        redisClient.json.arrPop(forumThreadKey, `${threadPath}.dislikes`, dislikeIndex),
        redisClient.json.numIncrBy(forumThreadKey, `${threadPath}.__v`, 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove dislike by a user from all threads under a forum
function cachedThreadRemoveDislikeByUser(forumId, userId) {
    if (!redisClient.isReady) {
        return;
    }

    const forumThreadKey = getForumThreadKey(forumId);
    return redisClient.json.del(forumThreadKey, getThreadDislikesPath(userId));
}

module.exports = {
    cachedThreadAddDislike,
    cachedThreadRemoveDislike,
    cachedThreadRemoveDislikeByUser
}