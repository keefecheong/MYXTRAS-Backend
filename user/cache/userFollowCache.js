// to update cached user when a follower is added/removed

const redisClient = require("../../cache/redis.js");
const {
  getUserKey,
  getFollowingKey,
  getFollowingPath,
  getFollowersPath,
} = require("./userCache.js");
const {
  getHeaderKey,
  USER_EXPIRATION_TIME,
} = require("../utils/cacheProperties.js");
const returnPromiseResult = require("../../utils/general/returnPromiseResult.js");

// to add follower to user in cache
async function cachedUserAddFollower(targetUserId, followerDetails) {
  if (!redisClient.isReady) {
    return false;
  }

  const targetUserKey = getUserKey(targetUserId);
  const followerFollowingKey = getFollowingKey(followerDetails._id);
  const headerKey = getHeaderKey(followerDetails._id);

  // add follower's id to target user's followers list
  const promises = [
    redisClient.json.arrAppend(
      targetUserKey,
      "$.followers",
      followerDetails._id
    ),
    redisClient.json.numIncrBy(targetUserKey, "$.__v", 1),
    redisClient.json.set(headerKey, "$", followerDetails),
    redisClient.expire(headerKey, USER_EXPIRATION_TIME),
  ];

  // if follower's following cache entry exists then add targetUser's id to that entry
  if (await redisClient.exists(followerFollowingKey)) {
    promises.push(
      redisClient.json.arrAppend(followerFollowingKey, "$", {
        _id: targetUserId,
      })
    );
  }

  // execute all
  return await returnPromiseResult(promises);
}

// to remove follower from user in cache
async function cachedUserRemoveFollower(
  targetUserId,
  followerId,
  increaseVersion
) {
  if (!redisClient.isReady) {
    return false;
  }

  const targetUserKey = getUserKey(targetUserId);
  const followerFollowingKey = getFollowingKey(followerId);

  // remove follower's id from target user's followers list
  const promises = [
    redisClient.json.del(targetUserKey, getFollowersPath(followerId)),
  ];

  if (increaseVersion) {
    redisClient.json.numIncrBy(targetUserKey, "$.__v", 1);
  }

  // if follower's following cache entry exists then delete following user's id from that list
  if (await redisClient.exists(followerFollowingKey)) {
    promises.push(
      redisClient.json.del(followerFollowingKey, getFollowingPath(targetUserId))
    );
  }

  // execute all
  return await returnPromiseResult(promises);
}

module.exports = {
  cachedUserAddFollower,
  cachedUserRemoveFollower,
};
