// to add users from the database to the cache

const redisClient = require("../../cache/redis.js");

// cache key prefixes
// to cache individual users
// format: 'user:single:userid'
const USER_SINGLE_KEY_BASE = "user:single";

// to cache user's following users' user id
// format: 'user:following:userid'
const USER_FOLLOWING_KEY_BASE = "user:following";

// to cache part of the user's details for reference
// format: 'user:header:userid'
const USER_HEADER_KEY_BASE = "user:header";

// expiration time
// 1 hour for all (cache is updated)
const USER_EXPIRATION_TIME = 60 * 60;

// to retrieve a single user from cache if exists
async function getUserFromCache(key, populateFollowers) {
  if (!redisClient.isReady) {
    return null;
  }

  let user = await redisClient.json.get(key);

  if (populateFollowers && user?.followers.length > 0) {
    // if request requires follower data check if the follower details are available
    const followersExist = await redisClient.exists(user.followers);

    // if follower data does not exist for all followers return null to request database to populate it
    if (followersExist == user.followers.length) {
      return null;
    }

    // otherwise set the populated data as followers
    user.followers = await Promise.all(
      user.followers.map((followerId) =>
        redisClient.json.get(getHeaderKey(followerId)),
      ),
    );
  }

  return user;
}

// to store user from database to cache
function cacheUser(data, key, populateFollowers) {
  // get a copy of data if need to manipulate to store followers
  const workingData = populateFollowers
    ? JSON.parse(JSON.stringify(data))
    : data;

  let followers;

  if (populateFollowers) {
    // if cache entry is for storing individual users and user's followers are populated then get the follower data
    followers = workingData.followers;

    // depopulate followers
    workingData.followers = followers.map((follower) => follower._id);
  }

  const headerKey = getHeaderKey(data._id);

  // set promises
  const promises = [
    redisClient.json.set(key, "$", workingData),
    redisClient.expire(key, USER_EXPIRATION_TIME),
    redisClient.json.set(headerKey, "$", getUserDetails(data)),
    redisClient.expire(headerKey, USER_EXPIRATION_TIME),
  ];

  // if there is follower data then add follower data to cache
  if (followers?.length > 0) {
    followers.forEach((follower) => {
      const followerHeaderKey = getHeaderKey(follower._id);

      promises.push(redisClient.json.set(followerHeaderKey, "$", follower));
      promises.push(
        redisClient.expire(followerHeaderKey, USER_EXPIRATION_TIME),
      );
    });
  }

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

function getHeaderKey(userId) {
  return `${USER_HEADER_KEY_BASE}:${userId}`;
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
  USER_EXPIRATION_TIME,
  getUserFromCache,
  cacheUser,
  getUserDetails,
  getUserKey,
  getFollowingKey,
  getHeaderKey,
  getFollowingPath,
  getBlockedPath,
  getFollowersPath,
  getUserIdFromKey,
};
