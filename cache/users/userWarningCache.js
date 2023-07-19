// to add warning to user in cache

const redisClient = require('../redis.js');

const { getUserKey } = require('./userCache.js');

// append warning to warnings array for the specified user
async function cachedUserAddWarning(userId, warning) {
    const key = getUserKey(userId);

    await redisClient.json.arrAppend(key, '$.warnings', warning);
}

module.exports = {
    cachedUserAddWarning
}