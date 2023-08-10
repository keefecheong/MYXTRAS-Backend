// to verify following status between users

const { User } = require('../models/user.js');

const redisClient = require('../../cache/redis.js');
const { USER_SINGLE_KEY_BASE, getUserKey, getFollowersPath } = require('../cache/userCache.js');

const { expect } = require('chai');
const expectEmpty = require('../../utils/test/expectEmpty.js');

const compareId = require('../../utils/general/compareId.js');

// check database records to determine whether user1 is following user2
async function verifyDBFollowing(followingUserId, followedUserId, blocked) {
    expect((await User.findById(followedUserId).lean())
        .followers.some(followerId => 
            compareId(followerId, followingUserId)
        )
    ).to.be.not.equal(blocked);
}

// check cache entry to determine whether user1 is following user2
async function verifyCacheFollowing(followingUserId, followedUserId, blocked) {
    expectEmpty(await redisClient.json.get(
        getUserKey(followedUserId), 
        { path: getFollowersPath(followingUserId) }
    ), blocked);
}

// check database records to determine if there are users following the target user
async function verifyDBHasFollowers(userId, terminated) {
    expectEmpty((await User.findById(userId).lean()).followers, terminated);
}

// check cache entry to determine if there are users following the target user
async function verifyCacheHasFollowers(userId, terminated) {
    expectEmpty((await redisClient.json.get(getUserKey(userId), { path: '$.followers' })).flat(), terminated);
}

// check database records to determine if a user is following any user
async function verifyDBIsFollowingAny(userId, terminated) {
    expectEmpty(await User.find({ followers: { $in: userId } }).lean(), terminated);
}

// check cache entry to determine if a user is following any user
async function verifyCacheIsFollowingAny(userId, terminated) {
    var following = [];

    for await (const key of redisClient.scanIterator({ MATCH: `${USER_SINGLE_KEY_BASE}:*` })) {
        const user = await redisClient.json.get(key);

        if (user.followers.some(followerId => compareId(followerId, userId))) {
            following.push(key);
        }
    }

    expectEmpty(following, terminated);
}

module.exports = {
    verifyDBFollowing,
    verifyCacheFollowing,
    verifyDBHasFollowers,
    verifyCacheHasFollowers,
    verifyDBIsFollowingAny,
    verifyCacheIsFollowingAny
}