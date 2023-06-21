const express = require('express');
const commentRouter = express.Router();
const Comment = require('../../models/comment.js');
const Thread = require('../../models/thread.js');

commentRouter.post('/', express.json(), async (req, res) => {
    
    if (!req.body.content) {
        res.status(400).json({ message: 'Comment content is required.' });
    }
    const comment = new Comment({
        creator_id: req.user._id,
        content: req.body.content,
        parent_id: res.thread._id
    });
    // update post's comments list
    res.thread.comments.push(comment._id);
    try {
        // update database
        await comment.save();
        await res.thread.save();

        // return the new comment data to update dom
        var newComment = await Comment
            .findById(comment._id)
            .populate({
                path: 'creator_id',
                select: 'username profile_pic_link real_name'
            });

        //newComment = checkCommentAttributes(newComment, req.user._id);

        res.status(200).json({ message: 'Comment created.', comment: newComment });
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }

});
commentRouter.get('/', async (req, res) => {
    try {
        // populate comment data to get creator's username and profile pic link
        const threadComments = await Thread
            .findById(res.thread._id)
            .sort({ creation_time: -1 })
            .select('comments')
            .populate({
                path: 'comments',
                populate: {
                    path: 'creator_id',
                    select: 'username profile_pic_link real_name'
                }
            }).lean()
        //const comments = checkCommentAttributesAll(threadComments.comments, req.user._id);

        res.status(200).json(threadComments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
})
module.exports = commentRouter;