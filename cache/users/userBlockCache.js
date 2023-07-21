// to update cache when user blocks another user

const redisClient = require('../redis.js');
const { getUserKey, getBlockedPath, getSavedPostPath } = require('./userCache.js');
const { cachedUserRemoveFollower } = require('./userFollowCache.js');
const { getUserPostKey } = require('../posts/postCache.js');
const { cachedPostRemoveLikeByUser } = require('../posts/postLikeCache.js');
const { deleteAllCachedComments, updateCachedParentCommentCount } = require('../comments/commentDeleteCache.js');
const { PARENT_MODEL_POST } = require('../../models/comment.js');

function cachedUserAddBlocked(selfId, isBlocker, blockEntry, commentsPerPost, followerIndex) {
    if (!redisClient.isReady) {
        return [];
    }

    const selfKey = getUserKey(selfId);
    const targetUserId = blockEntry.user_id;

    const promises = [redisClient.json.numIncrBy(selfKey, '$.__v', 1)];

    // if self is the blocker then add blocked_users entry
    if (isBlocker) {
        promises.push(redisClient.json.arrAppend(selfKey, '$.blocked_users', blockEntry));
    }

    // remove saved posts by the target user
    promises.push(redisClient.json.del(selfKey, getSavedPostPath(targetUserId)));

    // unfollow target user
    if (followerIndex != -1) {
        cachedUserRemoveFollower(targetUserId, selfId, true);
    }

    // remove likes by target user on self's posts
    const userPostKey = getUserPostKey(selfId);

    const userPostKeyExists = redisClient.exists(userPostKey);
    
    if (userPostKeyExists) {
        promises.push(cachedPostRemoveLikeByUser(targetUserId, selfId));
    }

    // delete comments by target user on self's posts
    commentsPerPost.forEach(async entry => {
        promises.push(deleteAllCachedComments(entry._id, PARENT_MODEL_POST, targetUserId));

        if (userPostKeyExists) {
            promises.push(updateCachedParentCommentCount(selfId, entry._id, PARENT_MODEL_POST, entry.comment_count));
        }
    });

    return promises;
}

// to remove blocked_users entry for the target user from requesting user's key
function cachedUserRemoveBlocked(selfId, targetUserId, increaseVersion) {
    if (!redisClient.isReady) {
        return [];
    }

    const key = getUserKey(selfId);

    const removeBlockPromise = redisClient.json.del(key, getBlockedPath(targetUserId));
    const increaseVersionPromise = redisClient.json.numIncrBy(key, '$.__v', 1);

    return increaseVersion ? [removeBlockPromise, increaseVersionPromise] : removeBlockPromise;
}

module.exports = {
    cachedUserAddBlocked,
    cachedUserRemoveBlocked
}