// handle routes related to comments under posts

// initialize router
const express = require('express');
const commentRouter = express.Router();

// get middleware
const { getComment } = require('../../middleware/forums/getCommentMiddleware.js');

// get controller functions
const { getComments, postComment, deleteComment } = require('../../controllers/posts/postCommentController.js');

// to get all comments
commentRouter.get('/', getComments);

// to create a comment
commentRouter.post('/', express.json(), postComment);

// to delete a comment
commentRouter.delete('/:commentId', getComment, deleteComment);

module.exports = commentRouter;