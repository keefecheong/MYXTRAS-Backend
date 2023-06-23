// controller functions to handle actions for comments under posts

const Comment = require('../../models/comment.js');
const { checkCommentAttributes, checkCommentAttributesAll } = require('../../utils/posts/checkAttributes.js');

// retrieve all comments for a post
const getComments = async (req, res) => {
    try {
        // populate comment data to get creator's username and profile pic link
        const postComments = await Comment
            .find({ parent_id: res.post._id })
            .populate({
                path: 'creator_id',
                select: 'username profile_pic_link'
            })
            .lean();

        const comments = checkCommentAttributesAll(postComments, req.user._id);

        res.status(200).json(comments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// create a comment and update the post's comments field
const postComment = async (req, res) => {
    // check if comments are enabled on the requested post
    // if enabled, continue to create comment
    // otherwise return 400 error
    if (!res.post.comments_enabled) {
        return res.status(400).json({ message: 'Comments are disabled for this post.' });
    }

    // check if content is provided in the body
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        return res.status(400).json({ message: 'Comment content is required.' });
    }

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
            .populate({
                path: 'creator_id',
                select: 'username profile_pic_link'
            })
            .lean();

        newComment = checkCommentAttributes(newComment, req.user._id);

        res.status(200).json({ message: 'Comment created.', comment: newComment });
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// delete a comment and update the post's comments field
const deleteComment = async (req, res) => {
    // check if comment exists
    const targetComment = await Comment.findById(req.params.commentId);

    // if comment exists, continue to delete the comment
    // otherwise, return 404 error
    if (!targetComment) {
        return res.status(404).json({ message: 'Unable to find the specified comment.' })
    }

    // check if the comment is posted by the requesting user
    // if creator is not the requesting user return 401 error
    if (!targetComment.creator_id._id.equals(req.user._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        // update database
        await Comment.findByIdAndDelete(req.params.commentId);

        res.status(200).json({ message: 'Comment deleted.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getComments,
    postComment,
    deleteComment
}