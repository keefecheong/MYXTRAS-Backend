// controller functions related to thread comments

const Comment = require('../../models/comment.js');
const { checkCommentAttributes, checkCommentAttributesAll } = require('../../utils/comments/checkAttributes.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// get all comments for a thread
async function getThreadComments(req, res) {
    try {
        var threadComments = await Comment
            .find({ parent_id: res.thread._id })
            .getCreator()
            .select('creator_id creation_time content')
            .lean();

        threadComments = checkCommentAttributesAll(threadComments, req.user._id);

        returnGoodReq(threadComments);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// add comment to thread
async function createComment(req, res) {
    // check if comment content is provided
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        return returnBadReq(res, 'Comment content is required.');
    }

    const comment = new Comment({
        creator_id: req.user._id,
        content: req.body.content,
        parent_id: res.thread._id,
        parent_model: 'Thread'
    });
    
    try {
        // update database
        await comment.save();

        // return the new comment data to update dom
        var newComment = await Comment
            .findById(comment._id)
            .getCreator()
            .select('creator_id creation_time content')
            .lean();

        newComment = checkCommentAttributes(newComment, req.user._id);

        returnGoodReq(res, { message: 'Comment created.', comment: newComment });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// delete comment
async function deleteComment(req, res) {
    // check if requesting user is the creator of the comment
    // if the requesting user is not the creator then return 401 error
    if (!req.user._id.equals(res.comment.creator_id._id)){
        return returnUnauthorizedReq(res);
    }

    try{
        await Comment.findByIdAndDelete(req.params.commentId);
        returnGoodReq(res, { message: 'Comment removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getThreadComments,
    createComment,
    deleteComment
}