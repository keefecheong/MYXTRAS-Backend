// to delete post entry from cache

const redisClient = require('../../cache/redis.js');

const { getUserIdFromKey } = require('../../user/cache/userCache.js');
const { POST_USER_KEY_BASE, getUserPostKey, getPostIdPath } = require('./postCache.js');
const { cachedPostRemoveLikeByUser } = require('./postLikeCache.js');
const { cachedPostRemoveSaveByUser } = require('./postSaveCache.js');
const { deleteAllCachedComments } = require('../../comment/cache/commentDeleteCache.js');
const { PARENT_MODEL_POST } = require('../../comment/models/comment.js');

const compareId = require('../../utils/general/compareId.js');

// to delete post entry from cache
function deleteCachedPost(userId, postId) {
    if (!redisClient.isReady) {
        return [];
    }

    // remove post entry and associated comments from cache
    return [
        redisClient.json.del(getUserPostKey(userId), getPostIdPath(postId)),
        deleteAllCachedComments(postId, PARENT_MODEL_POST)
    ];
}

// delete all created posts and child comments when a user is terminated
async function deleteCachedPostsOnTerminate(userId) {
    const promises = [];

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

    return promises;
}

module.exports = {
    deleteCachedPost,
    deleteCachedPostsOnTerminate
}