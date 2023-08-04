// handle routes related to thread comments

const express = require('express');
const commentRouter = express.Router();

const { getComment } = require('../../comment/middleware/getCommentMiddleware.js')

const { getThreadComments, createComment, deleteComment } = require('../../comment/controllers/threadCommentController.js');

const { PARENT_MODEL_THREAD } = require('../../comment/models/comment.js');

// get all comments for a thread
commentRouter.get('/', getThreadComments);

// create new comment
commentRouter.post('/', express.json(), createComment);

//delete comment
commentRouter.delete('/:commentId', (req, res, next) => getComment(req, res, next, PARENT_MODEL_THREAD), deleteComment)

module.exports = commentRouter;