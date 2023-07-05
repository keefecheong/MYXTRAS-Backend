// controller functions to handle actions for comments under posts

const Comment = require('../../models/comment.js');
const { checkCommentAttributes, checkCommentAttributesAll } = require('../../utils/comments/checkAttributes.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// retrieve all comments for a post
async function getComments(req, res) {
    try {
        // populate comment data to get creator's username and profile pic link
        const postComments = await Comment
            .find({ parent_id: res.post._id })
            .getCreator()
            .lean();

        const comments = checkCommentAttributesAll(postComments, req.user._id);

        returnGoodReq(res, comments);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// create a comment and update the post's comments field
async function postComment(req, res) {
    // check if comments are enabled on the requested post
    // if enabled, continue to create comment
    // otherwise return 400 error
    if (!res.post.comments_enabled) {
        return returnBadReq(res, 'Comments are disabled for this post.');
    }

    // check if content is provided in the body
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        return returnBadReq(res, 'Comment content is required.');
    }

    // create new comment
    const comment = new Comment({
        creator_id: req.user._id,
        content: req.body.content,
        parent_id: res.post._id,
        parent_model: 'Post'
    });

    try {
        // update database
        await comment.save();

        // return the new comment data to update dom
        var newComment = await Comment
            .findById(comment._id)
            .getCreator()
            .lean();

        newComment = checkCommentAttributes(newComment, req.user._id);

        returnGoodReq(res, { message: 'Comment created.', comment: newComment });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// delete a comment and update the post's comments field
async function deleteComment(req, res) {
    // check if the comment is posted by the requesting user
    // if creator is not the requesting user return 401 error
    if (!res.comment.creator_id._id.equals(req.user._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        // update database
        await Comment.findByIdAndDelete(req.params.commentId);

        returnGoodReq(res, { message: 'Comment deleted.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getComments,
    postComment,
    deleteComment
}