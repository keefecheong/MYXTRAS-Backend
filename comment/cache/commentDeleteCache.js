// to delete cache entry if comment is present in cache

const redisClient = require('../../cache/redis.js');
const { getPostCommentKey, getThreadCommentKey, getCommentByUserPath } = require('./commentCache.js');
const { getPostIdPath, getUserPostKey } = require('../../post/cache/postCache.js');
const { getThreadIdPath, getForumThreadKey } = require('../../thread/cache/threadCache.js');
const { getCommentIdPath } = require('./commentCache.js');

const { PARENT_MODEL_POST } = require('../models/comment.js');

// to delete a comment from cache
function deleteCachedComment(forPost, commentId, commentInCache, parentInCache, parentKey, parentId) {
    if (!redisClient.isReady) {
        return [];
    }

    const promises = [];
    
    // if comment is in cache then remove comment
    if (commentInCache) {
        const key = forPost ? getPostCommentKey(parentId) : getThreadCommentKey(parentId);
        promises.push(redisClient.json.del(key, getCommentIdPath(commentId)));
    }

    // if parent object is in cache then update parent object's comment_count value
    if (parentInCache) {
        const parentPath = forPost ? getPostIdPath(parentId) : getThreadIdPath(parentId);
        promises.push(redisClient.json.numIncrBy(parentKey, `${parentPath}.comment_count`, -1));
    }

    return promises;
}

// to delete all comments from cache for a specified parent
function deleteAllCachedComments(parentId, parentModel, creatorId) {
    if (!redisClient.isReady) {
        return [];
    }

    const key = parentModel == PARENT_MODEL_POST ? getPostCommentKey(parentId) : getThreadCommentKey(parentId);

    let path = '$';

    if (creatorId) {
        path = getCommentByUserPath(creatorId);
    }

    return redisClient.json.del(key, path);
}

// to update parent's comment_count
function updateCachedParentCommentCount(keyCreationId, parentId, parentModel, deletedCommentCount) {
    let key;
    let path;

    if (parentModel == PARENT_MODEL_POST) {
        key = getUserPostKey(keyCreationId);
        path = `${getPostIdPath(parentId)}.comment_count`;
    }
    else {
        key = getForumThreadKey(keyCreationId);
        path = `${getThreadIdPath(parentId)}.comment_count`;
    }

    // check if parent exists before reducing comment count
    return redisClient.exists(key).then(result => {
        if (result) {
            return redisClient.json.numIncrBy(key, path, -(deletedCommentCount));
        }
    });
}

module.exports = {
    deleteCachedComment,
    deleteAllCachedComments,
    updateCachedParentCommentCount
}