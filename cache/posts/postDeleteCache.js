// to delete post entry from cache

const redisClient = require('../redis.js');
const Post = require('../../models/post.js');

const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');
const { getPostCommentKey } = require('../../cache/comments/commentCache.js');
const { deleteAllCachedComments } = require('../../cache/comments/commentDeleteCache.js');

// to delete post entry from cache and database
function deleteCachedPost(key, postIndex, postId) {
    const postIdKey = getIndexKey(key);

    // remove post entry and associated comments from cache and database
    return Promise.all([
        redisClient.json.arrPop(key, '$', postIndex),
        redisClient.json.arrPop(postIdKey, '$', postIndex),
        Post.findByIdAndDelete(postId),
        deleteAllCachedComments(getPostCommentKey(postId))
    ]);
}

module.exports = {
    deleteCachedPost
}