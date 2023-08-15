// to add new user/update existing user in cache

const redisClient = require("../../cache/redis.js");
const { getUserKey } = require("./userCache.js");
const {
  USER_EXPIRATION_TIME,
  getHeaderKey,
} = require("../utils/cacheProperties.js");
const returnPromiseResult = require("../../utils/general/returnPromiseResult.js");

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
    redisClient.json.set(key, "$", jsonUser),
    redisClient.expire(key, USER_EXPIRATION_TIME),
  ];

  await Promise.all(promises);
}

// to update user data in cache
async function updateCachedUser(updatedValues, userId, increaseVersion) {
  if (!redisClient.isReady) {
    return false;
  }

  const key = getUserKey(userId);

  // increase version key
  const promises = increaseVersion
    ? [redisClient.json.numIncrBy(key, "$.__v", 1)]
    : [];

  // add promise for each updated key/value
  for (const updatedKey in updatedValues) {
    if (updatedValues.hasOwnProperty(updatedKey)) {
      promises.push(
        redisClient.json.set(key, `$.${updatedKey}`, updatedValues[updatedKey])
      );

      // update header entry if updated value is for profile pic or username
      if (updatedKey == "profile_pic_link" || updatedKey == "username") {
        const headerKey = getHeaderKey(userId);
        promises.push(
          redisClient.json.set(
            headerKey,
            `$.${updatedKey}`,
            updatedValues[updatedKey]
          )
        );
      }
    }
  }

  // update user
  return increaseVersion ? await returnPromiseResult(promises) : promises;
}

module.exports = {
  cacheNewUser,
  updateCachedUser,
};
