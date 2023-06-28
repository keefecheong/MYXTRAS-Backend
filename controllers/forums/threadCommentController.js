// controller functions related to thread comments

const Comment = require('../../models/comment.js');

// get all comments for a thread
const getThreadComments = async (req, res) => {
    try {
        const threadComments = await Comment
            .find({ parent_id: res.thread._id })
            .populate({
                path: 'creator_id',
                select: 'username profile_pic_link real_name'
            })
            .select('creator_id creation_time content')
            .lean();
        //const comments = checkCommentAttributesAll(threadComments.comments, req.user._id);

        res.status(200).json(threadComments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// add comment to thread
const createComment = async (req, res) => {
    // check if comment content is provided
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        return res.status(400).json({ message: 'Comment content is required.' });
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
            .populate({
                path: 'creator_id',
                select: 'username profile_pic_link real_name'
            })
            .select('creator_id creation_time content')
            .lean();

        //newComment = checkCommentAttributes(newComment, req.user._id);

        res.status(200).json({ message: 'Comment created.', comment: newComment });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }

}

// delete comment
const deleteComment = async (req, res) => {
    if (!req.user._id.equals(res.thread.creator_id.id)){
        return res.status(401).json({message: 'Unauthorized.'});
    }

    try{
        await Comment.findByIdAndDelete(req.params.commentId);
        res.status(200).json({ message: 'Comment removed.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getThreadComments,
    createComment,
    deleteComment
}