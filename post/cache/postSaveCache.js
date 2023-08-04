// to update cached post when saved/unsaved

const redisClient = require('../../cache/redis.js');
const { getUserPostKey, getPostIdPath, getPostSavesPath } = require('./postCache.js');
const returnPromiseResult = require('../../utils/general/returnPromiseResult.js');

// to add user to saved_by
async function cachedPostAddSave(creatorId, postId, userId) {
    if (!redisClient.isReady) {
        return false;
    }

    const postKey = getUserPostKey(creatorId);
    const postPath = getPostIdPath(postId);

    const promises = [
        redisClient.json.arrAppend(postKey, `${postPath}.saved_by`, userId),
        redisClient.json.numIncrBy(postKey, `${postPath}.__v`, 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove user from saved_by
async function cachedPostRemoveSave(creatorId, postId, saveIndex) {
    if (!redisClient.isReady) {
        return false;
    }

    const postKey = getUserPostKey(creatorId);
    const postPath = getPostIdPath(postId);

    const promises = [
        redisClient.json.arrPop(postKey, `${postPath}.saved_by`, saveIndex),
        redisClient.json.numIncrBy(postKey, `${postPath}.__v`, 1)
    ];

    return await returnPromiseResult(promises);
}

// to remove user from saved_by of all posts under a root post key in cache
function cachedPostRemoveSaveByUser(creatorId, ownerId) {
    if (!redisClient.isReady) {
        return;
    }

    const postKey = getUserPostKey(ownerId);
    return redisClient.json.del(postKey, getPostSavesPath(creatorId, true));
}

module.exports = {
    cachedPostAddSave,
    cachedPostRemoveSave,
    cachedPostRemoveSaveByUser
}