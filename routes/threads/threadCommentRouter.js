// handle routes related to thread comments

const express = require('express');
const commentRouter = express.Router();

const { getComment } = require('../../middleware/comments/getCommentMiddleware.js')

const { getThreadComments, createComment, deleteComment } = require('../../controllers/threads/threadCommentController.js');

// get all comments for a thread
commentRouter.get('/', getThreadComments);

// create new comment
commentRouter.post('/', express.json(), createComment);

//delete comment
commentRouter.delete('/:commentId', getComment('thread'), deleteComment)

module.exports = commentRouter;