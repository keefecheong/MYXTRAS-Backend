// handle routes related to comments under posts

// initialize router
const express = require('express');
const commentRouter = express.Router();

// get middleware
const { getComment } = require('../../comment/middleware/getCommentMiddleware.js');

// get controller functions
const { getComments, postComment, deleteComment } = require('../../comment/controllers/postCommentController.js');

const { PARENT_MODEL_POST } = require('../../comment/models/comment.js');

// to get all comments
commentRouter.get('/', getComments);

// to create a comment
commentRouter.post('/', express.json(), postComment);

// to delete a comment
commentRouter.delete('/:commentId', (req, res, next) => getComment(req, res, next, PARENT_MODEL_POST), deleteComment);

module.exports = commentRouter;