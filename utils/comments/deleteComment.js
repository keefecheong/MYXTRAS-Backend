// to delete a comment

const { Comment } = require('../../models/comment.js');

const performAllSync = require('../cache/performAllSync.js');

const { deleteCachedComment } = require('../../cache/comments/commentDeleteCache.js');

// delete comment from cache and database
module.exports = function deleteCommentUtil(forPost, commentId, commentInCache, parentInCache, parentKey, parentId) {
    const promises = deleteCachedComment(forPost, commentId, commentInCache, parentInCache, parentKey, parentId);

    return performAllSync(promises, Comment.findByIdAndDelete(commentId));
}