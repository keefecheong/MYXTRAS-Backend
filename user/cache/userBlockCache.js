// to update cache when user blocks another user

const redisClient = require('../../cache/redis.js');

const { getUserKey, getBlockedPath } = require('./userCache.js');
const { cachedUserRemoveFollower } = require('./userFollowCache.js');

const { getUserPostKey } = require('../../post/cache/postCache.js');
const { cachedPostRemoveLikeByUser } = require('../../post/cache/postLikeCache.js');
const { cachedPostRemoveSaveByUser } = require('../../post/cache/postSaveCache.js');

const { deleteAllCachedComments, updateCachedParentCommentCount } = require('../../comment/cache/commentDeleteCache.js');
const { PARENT_MODEL_POST } = require('../../comment/models/comment.js');

async function cachedUserAddBlocked(selfId, isBlocker, blockEntry, commentsPerPost, followerIndex) {
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

    // unfollow target user
    if (followerIndex != -1) {
        cachedUserRemoveFollower(targetUserId, selfId, true);
    }

    // remove likes and save by target user on self's posts
    const userPostKey = getUserPostKey(selfId);

    const userPostKeyExists = await redisClient.exists(userPostKey);
    
    if (userPostKeyExists) {
        promises.push(cachedPostRemoveLikeByUser(targetUserId, selfId));
        promises.push(cachedPostRemoveSaveByUser(targetUserId, selfId));
    }

    // delete comments by target user on self's posts
    commentsPerPost.forEach(entry => {
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