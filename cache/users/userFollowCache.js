// to update cached user when a follower is added/removed

const redisClient = require('../redis.js');

const { getUserKey, getFollowerKey, getFollowingKey } = require('./userCache.js');
const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');

// to add follower to user in cache and update database asynchronously
async function cachedUserAddFollower(targetUser, followerDetails) {
    const targetUserKey = getUserKey(targetUser._id);
    const targetUserFollowerKey = getFollowerKey(targetUser._id);
    const followerFollowingKey = getFollowingKey(followerDetails._id);

    // add follower's id to target user's followers list
    const promises = [
        redisClient.json.arrAppend(targetUserKey, '$.followers', followerDetails._id),
        redisClient.json.numIncrBy(targetUserKey, '$.__v', 1)
    ];

    // if target user's populated follower cache entry exists then add details to that entry
    if (await redisClient.exists(targetUserFollowerKey)) {
        promises.concat([
            redisClient.json.arrAppend(targetUserFollowerKey, '$', followerDetails),
            redisClient.json.arrAppend(getIndexKey(targetUserFollowerKey), '$', followerDetails._id)
        ]);
    }

    // if follower's following cache entry exists then add new following user's details
    if (await redisClient.exists(followerFollowingKey)) {
        const followingDetails = {
            _id: targetUser._id,
            username: targetUser.username,
            profile_pic_link: targetUser.profile_pic_link
        };

        promises.concat([
            redisClient.json.arrAppend(followerFollowingKey, '$', followingDetails),
            redisClient.json.arrAppend(getIndexKey(followerFollowingKey), '$', followingDetails._id)
        ]);
    }

    // execute all
    await Promise.all(promises);

    // asynchronously update database
    targetUser.save().catch(error => console.log(error));
}

// to remove follower from user in cache and update database asynchronously
async function cachedUserRemoveFollower(targetUser, followerId, followerIndex, followingIndex) {
    const targetUserKey = getUserKey(targetUser._id);
    const targetUserFollowerKey = getFollowerKey(targetUser._id);
    const followerFollowingKey = getFollowingKey(followerId);

    // remove follower's id from target user's followers list
    const promises = [
        redisClient.json.arrPop(targetUserKey, '$.followers', followerIndex),
        redisClient.json.numIncrBy(targetUserKey, '$.followers', 1)
    ];

    // if target user's populated follower cache entry exists then remove follower's details from that list
    if (await redisClient.exists(targetUserFollowerKey)) {
        promises.concat([
            redisClient.json.arrPop(targetUserFollowerKey, '$', followerIndex),
            redisClient.json.arrPop(getIndexKey(targetUserFollowerKey), '$', followerIndex)
        ]);
    }

    // if follower's following cache entry exists then delete following user's detials from that list
    if (followingIndex != null) {
        promises.concat([
            redisClient.json.arrPop(followerFollowingKey, '$', followingIndex),
            redisClient.json.arrPop(getIndexKey(followerFollowingKey), '$', followingIndex)
        ]);
    }

    // execute all
    await Promise.all(promises);

    // asynchronously update database
    targetUser.save().catch(error => console.log(error));
}

module.exports = {
    cachedUserAddFollower,
    cachedUserRemoveFollower
}