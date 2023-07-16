// handle routes related to comments under posts

// initialize router
const express = require('express');
const commentRouter = express.Router();

// get middleware
const { getComment } = require('../../middleware/comments/getCommentMiddleware.js');

// get controller functions
const { getComments, postComment, deleteComment } = require('../../controllers/posts/postCommentController.js');

const { PARENT_MODEL_POST } = require('../../models/comment.js');

// to get all comments
commentRouter.get('/', getComments);

// to create a comment
commentRouter.post('/', express.json(), postComment);

// to delete a comment
commentRouter.delete('/:commentId', getComment(PARENT_MODEL_POST), deleteComment);

module.exports = commentRouter;