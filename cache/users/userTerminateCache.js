// to update cache when user is terminated

const redisClient = require('../redis.js');
const compareId = require('../../utils/general/compareId.js');

const { USER_SINGLE_KEY_BASE, getFollowerKey, getFollowingKey, getUserIdFromKey } = require('./userCache.js');
const { cachedUserRemoveFollower } = require('./userFollowCache.js');
const { updateCachedUser } = require('./userUpdateCache.js');
const { cachedUserRemoveBlocked } = require('./userBlockCache.js');
const { POST_USER_KEY_BASE } = require('../posts/postCache.js');
const { deleteCachedPost } = require('../posts/postDeleteCache.js');
const { cachedPostRemoveLikeByUser } = require('../posts/postLikeCache.js');
const { cachedPostRemoveSaveByUser } = require('../posts/postSaveCache.js');
const { FORUM_SINGLE_KEY_BASE } = require('../forums/forumCache.js');
const { deleteCachedForum } = require('../forums/forumDeleteCache.js');
const { cachedForumRemoveSubscriber } = require('../forums/forumSubscribeCache.js');
const { deleteCachedThread } = require('../threads/threadDeleteCache.js');
const { cachedThreadRemoveLikeByUser } = require('../threads/threadLikeCache.js');
const { cachedThreadRemoveDislikeByUser } = require('../threads/threadDislikeCache.js');
const { deleteAllCachedComments, updateCachedParentCommentCount } = require('../comments/commentDeleteCache.js');

async function terminateCachedUser(userId, updatedValues, commentsPerParent) {
    if (!redisClient.isReady) {
        return;
    }

    // set terminated status and clear followers and blocked_users for target user
    // delete target user's following and followers entry
    const promises = [
        ...(await updateCachedUser(updatedValues, userId, false)),
        redisClient.json.del(getFollowingKey(userId), '$'),
        redisClient.json.del(getFollowerKey(userId), '$')
    ];

    // delete target user from other users' blocked_users and followers list
    for await (const key of redisClient.scanIterator({ MATCH: `${USER_SINGLE_KEY_BASE}:*` })) {
        const targetUserId = getUserIdFromKey(key);

        promises.push(cachedUserRemoveBlocked(userId, targetUserId, false));
        promises.push(cachedUserRemoveFollower(targetUserId, userId, false));
    }

    // delete all created posts and child comments
    for await (const key of redisClient.scanIterator({ MATCH: `${POST_USER_KEY_BASE}:*` })) {
        const targetUserId = getUserIdFromKey(key);

        if (compareId(targetUserId, userId)) {
            // delete terminated user's posts and associated comments
            const postIds = await redisClient.json.get(key, { path: '$.*._id' });
            postIds.forEach(postId => {
                promises.push(deleteCachedPost(userId, postId));
            });    
        }
        else {
            // remove likes by terminated user on other users' posts
            promises.push(cachedPostRemoveLikeByUser(userId, targetUserId));

            // remove terminated user from saved_by list on other users' posts
            promises.push(cachedPostRemoveSaveByUser(userId, targetUserId));
        }
    }

    // delete all created forums
    for await (const key of redisClient.scanIterator({ MATCH: `${FORUM_SINGLE_KEY_BASE}:*` })) {
        const ids = await redisClient.json.get(key, { path: '$.._id' });
        const forumId = ids[0];
        const targetUserId = ids[1];

        if (compareId(targetUserId, userId)) {
            // deleted terminated user's forums and associated threads and comments
            promises.push(...(await deleteCachedForum(forumId, targetUserId)));
        }
        else {
            // remove subscribe by terminated user on other users' forums
            promises.push(cachedForumRemoveSubscriber(forumId, userId, false));

            // delete all created threads
            promises.push(...deleteCachedThread(forumId, null, userId));

            // remove likes and dislikes from other users' threads
            promises.push(cachedThreadRemoveLikeByUser(forumId, userId));
            promises.push(cachedThreadRemoveDislikeByUser(forumId, userId));
        }
    }

    // delete all created comments and update parent respectively
    commentsPerParent.forEach(entry => {
        promises.push(deleteAllCachedComments(entry._id, entry.parent_model, userId));
        promises.push(updateCachedParentCommentCount(entry.key_creation_id, entry._id, entry.parent_model, entry.count));
    });

    return Promise.all(promises);
}

module.exports = {
    terminateCachedUser
}