// to delete a post

const Post = require('../models/post.js');
const performAllSync = require('../../utils/general/performAllSync.js');
const { deleteCachedPost } = require('../cache/postDeleteCache.js');

module.exports = function deletePostUtil(creatorId, postId, postInCache) {
    let promises = [];

    // if post is in cache then get promises to update cache
    if (postInCache) {
        promises = deleteCachedPost(creatorId, postId);
    }
    
    // delete from cache and database together
    return performAllSync(promises, Post.findByIdAndDelete(postId));
}