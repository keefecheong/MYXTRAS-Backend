// middleware to get a comment

const { Comment, PARENT_MODEL_POST } = require('../../models/comment.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getCommentFromCache, getPostCommentKey, getThreadCommentKey } = require('../../cache/comments/commentCache.js');

async function getComment(req, res, next, type) {
    const forPost = type == PARENT_MODEL_POST;

    let target = null;

    try {
        const commentId = req.params.commentId;

        const key = forPost ? getPostCommentKey(res.post._id) : getThreadCommentKey(res.thread._id);

        // attempt to get comment from cache
        const result = await getCommentFromCache(key, commentId);

        const commentRetrieved = result != null;

        res.commentFromCache = commentRetrieved;

        // if retrieval is successful then set target as retrieved comment
        if (commentRetrieved) {
            target = result[0];
        }
        else {
            // if comment is not found from cache then retrieve from database
            target = await Comment.findById(commentId).lean();
        }

        // if target is still null means the comment does not exist, return 404 error
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.comment = target;
    next();
}

module.exports = {
    getComment
}