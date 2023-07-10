// middleware to get a comment

const Comment = require('../../models/comment.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { COMMENT_POST_KEY_BASE, COMMENT_THREAD_KEY_BASE, getCommentFromCache } = require('../../cache/comments/commentCache.js');

function getComment(type) {
    const forPost = type == 'post';
    const prefix = forPost ? COMMENT_POST_KEY_BASE : COMMENT_THREAD_KEY_BASE;

    return async function(req, res, next) {
        let target = null;

        try {
            // attempt to get comment from cache
            const result = await getCommentFromCache(`${prefix}:${forPost ? res.post._id : res.thread._id}`, req.params.commentId);

            // if retrieval is successful then set target as retrieved comment
            if (result.success) {
                target = result.comment;

                // set commentFromCache to indicate the comment is retrieved from cache
                res.commentFromCache = true;
                res.commentIndex = result.commentIndex;
            }
            else {
                // if error is not produced because comment is not found in cache then return 500 error
                if (result.error != "ERR Path '$' does not exist") {
                    return returnServerErrorReq(res);
                }

                // if comment is not found from cache then retrieve from database
                target = await Comment.findById(req.params.commentId).lean();

                // set commentFromCache to indicate the comment is not retrieved from cache
                res.commentFromCache = false;
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
}

module.exports = {
    getComment
}