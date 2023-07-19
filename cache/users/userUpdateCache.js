// to add new user/update existing user in cache

const redisClient = require('../redis.js');
const { getUserKey, USER_EXPIRATION_TIME } = require('./userCache.js');
const returnPromiseResult = require('../../utils/cache/returnPromiseResult.js');

// to add new user to cache
async function cacheNewUser(user) {
    if (!redisClient.isReady) {
        return;
    }

    const jsonUser = user.toObject();

    delete jsonUser.email;
    delete jsonUser.phone_number;
    delete jsonUser.password;

    const key = getUserKey(user._id);

    // update cache
    const promises = [
        redisClient.json.set(key, '$', jsonUser),
        redisClient.expire(key, USER_EXPIRATION_TIME)
    ];

    await Promise.all(promises);
}

// to update user data in cache
async function updateCachedUser(updatedValues, userId) {
    if (!redisClient.isReady) {
        return false;
    }

    const key = getUserKey(userId);

    // increase version key
    const promises = [redisClient.json.numIncrBy(key, '$.__v', 1)];
    
    // add promise for each updated key/value
    for (const updatedKey in updatedValues) {
        if (updatedValues.hasOwnProperty(updatedKey)) {
            promises.push(redisClient.json.set(key, `$.${updatedKey}`, updatedValues[updatedKey]));
        }
    }
    
    // update user
    return await returnPromiseResult(promises);
}

module.exports = {
    cacheNewUser,
    updateCachedUser
}