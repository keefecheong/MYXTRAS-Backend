// to add users from the database to the cache

const redisClient = require("../../cache/redis.js");
const {
  storeDetailsMany,
  retrieveDetailsMany,
} = require("../utils/userDetailsCacheUtil.js");
const {
  USER_EXPIRATION_TIME,
  getHeaderKey,
} = require("../utils/cacheProperties.js");

// cache key prefixes
// to cache individual users
// format: 'user:single:userid'
const USER_SINGLE_KEY_BASE = "user:single";

// to cache user's following users' user id
// format: 'user:following:userid'
const USER_FOLLOWING_KEY_BASE = "user:following";

// to retrieve user data from cache if exists
async function getUserFromCache(key, populateFollowers) {
  if (!redisClient.isReady) {
    return null;
  }

  let data = await redisClient.json.get(key);

  const dataIsArray = Array.isArray(data);

  if (!populateFollowers) return data;

  if (!dataIsArray && data?.followers.length > 0) {
    // if request is for a single user and requires follower data check if the follower details are available
    const followersExist = await redisClient.exists(data.followers);

    // if follower data does not exist for all followers return null to request database to populate it
    if (followersExist != data.followers.length) {
      return null;
    }

    // otherwise set the populated data as followers
    data.followers = await Promise.all(
      data.followers.map((followerId) =>
        redisClient.json.get(getHeaderKey(followerId))
      )
    );
  } else if (dataIsArray) {
    // otherwise if data is array means request is for following users
    // populate following users' data
    await retrieveDetailsMany(data, true);
  }

  return data;
}

// to store user from database to cache
function cacheUser(data, key, populateFollowers) {
  // get a copy of data if need to manipulate to store followers
  let userWorkingData = populateFollowers
    ? JSON.parse(JSON.stringify(data))
    : data;

  let followers;
  let promises = [];

  if (!Array.isArray(userWorkingData)) {
    if (populateFollowers) {
      // if cache entry is for storing individual users and user's followers are populated then get the follower data
      followers = userWorkingData.followers;

      // depopulate followers
      userWorkingData.followers = followers.map((follower) => follower._id);

      followers.forEach((follower) => {
        const followerHeaderKey = getHeaderKey(follower._id);

        promises.push(redisClient.json.set(followerHeaderKey, "$", follower));
        promises.push(
          redisClient.expire(followerHeaderKey, USER_EXPIRATION_TIME)
        );
      });
    } else {
      // otherwise get the user details to store
      const headerKey = getHeaderKey(data._id);
      promises.push(redisClient.json.set(headerKey, "$", getUserDetails(data)));
      promises.push(redisClient.expire(headerKey, USER_EXPIRATION_TIME));
    }
  } else {
    // otherwise if for storing following users then extract the following users' information and store in header keys
    const { workingData, creatorDetailsPromises } = storeDetailsMany(
      data,
      true
    );
    userWorkingData = workingData;
    promises = promises.concat(creatorDetailsPromises);
  }

  // set promises
  promises.concat([
    redisClient.json.set(key, "$", userWorkingData),
    redisClient.expire(key, USER_EXPIRATION_TIME),
  ]);

  return Promise.all(promises);
}

// to get user details to store in header key from a user
function getUserDetails(user) {
  return {
    _id: user._id,
    username: user.username,
    profile_pic_link: user.profile_pic_link,
    blocked_users: user.blocked_users,
  };
}

// to get cache keys
function getUserKey(userId) {
  return `${USER_SINGLE_KEY_BASE}:${userId}`;
}

function getFollowingKey(userId) {
  return `${USER_FOLLOWING_KEY_BASE}:${userId}`;
}

// get userId from user key
function getUserIdFromKey(key) {
  return key.split(":")[2];
}

// to get path by user id
function getFollowingPath(userId) {
  return `$[?(@._id=="${userId}")]`;
}

function getBlockedPath(userId) {
  return `$.blocked_users[?(@.user_id=="${userId}")]`;
}

function getFollowersPath(userId) {
  return `$.followers[?(@=="${userId}")]`;
}

module.exports = {
  USER_SINGLE_KEY_BASE,
  getUserFromCache,
  cacheUser,
  getUserDetails,
  getUserKey,
  getFollowingKey,
  getFollowingPath,
  getBlockedPath,
  getFollowersPath,
  getUserIdFromKey,
};
