// to delete post entry from cache

const redisClient = require('../redis.js');

const { getUserPostKey, getPostIdPath } = require('./postCache.js');
const { deleteAllCachedComments } = require('../../cache/comments/commentDeleteCache.js');
const { PARENT_MODEL_POST } = require('../../models/comment.js');

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

module.exports = {
    deleteCachedPost
}