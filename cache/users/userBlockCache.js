// to update cache when user blocks another user

const redisClient = require('../redis.js');
const { getUserKey, getBlockedPath, getSavedPostPath } = require('./userCache.js');
const { cachedUserRemoveFollower } = require('./userFollowCache.js');
const { getUserPostKey, getPostIdPath, getPostLikesPath } = require('../posts/postCache.js');
const { getPostCommentKey, getCommentByUserPath } = require('../comments/commentCache.js');

function cachedUserAddBlocked(selfId, isBlocker, blockEntry, commentsPerPost, followerIndex) {
    if (!redisClient.isReady) {
        return [];
    }

    const selfKey = getUserKey(selfId);
    const targetUserid = blockEntry.user_id;

    const promises = [redisClient.json.numIncrBy(selfKey, '$.__v', 1)];

    // if self is the blocker then add blocked_users entry
    if (isBlocker) {
        promises.push(redisClient.json.arrAppend(selfKey, '$.blocked_users', blockEntry));
    }

    // remove saved posts by the target user
    promises.push(redisClient.json.del(selfKey, getSavedPostPath(targetUserid)));

    // unfollow target user
    if (followerIndex != -1) {
        cachedUserRemoveFollower(targetUserid, selfId, followerIndex);
    }

    // remove likes by target user on self's posts
    const userPostKey = getUserPostKey(selfId);

    const userPostKeyExists = redisClient.exists(userPostKey);
    
    if (userPostKeyExists) {
        promises.push(redisClient.json.del(userPostKey, getPostLikesPath(targetUserid, true)));
    }

    // delete comments by target user on self's posts
    commentsPerPost.forEach(entry => {
        promises.push(redisClient.json.del(getPostCommentKey(entry._id), getCommentByUserPath(targetUserid)));

        if (userPostKeyExists) {
            promises.push(redisClient.json.numIncrBy(userPostKey, `${getPostIdPath(entry._id)}.comment_count`, -(entry.comment_count)));
        }
    });

    return promises;
}

// to remove blocked_users entry for the target user from requesting user's key
function cachedUserRemoveBlocked(selfId, targetUserId) {
    if (!redisClient.isReady) {
        return [];
    }

    const key = getUserKey(selfId);

    const promises = [
        redisClient.json.del(key, getBlockedPath(targetUserId)),
        redisClient.json.numIncrBy(key, '$.__v', 1)
    ];

    return promises;
}

module.exports = {
    cachedUserAddBlocked,
    cachedUserRemoveBlocked
}