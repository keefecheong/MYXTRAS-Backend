// to add new user/update existing user in cache

const redisClient = require('../redis.js');
const { getUserKey, USER_EXPIRATION_TIME } = require('./userCache.js');

// to add new user to cache and to database synchronously
function cacheNewUser(user) {
    const jsonUser = user.toObject();

    delete jsonUser.email;
    delete jsonUser.phone_number;
    delete jsonUser.password;

    const key = getUserKey(user._id);

    // update cache and database synchronously
    const promises = [
        redisClient.json.set(key, '$', jsonUser),
        redisClient.expire(key, USER_EXPIRATION_TIME),
        user.save()
    ];

    return Promise.all(promises);
}

// to update user data in cache and update database asynchronously
async function updateCachedUser(updatedValues, user) {
    const key = getUserKey(user._id);

    // increase version key
    const promises = [redisClient.json.numIncrBy(key, '$.__v', 1)];

    // add promise for each updated key/value
    for (const updatedKey in updatedValues) {
        if (updatedValues.hasOwnProperty(updatedKey)) {
            promises.push(redisClient.json.set(key, `$.${updatedKey}`, updatedValues[updatedKey]));
        }
    }

    // update user
    await Promise.all(promises);

    // asynchronously update database
    user.save().catch(error => console.log(error));
}

module.exports = {
    cacheNewUser,
    updateCachedUser
}