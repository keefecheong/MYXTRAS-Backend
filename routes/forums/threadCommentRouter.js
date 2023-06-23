// handle routes related to thread comments

const express = require('express');
const commentRouter = express.Router();

const { getThreadComments, createComment } = require('../../controllers/forums/threadCommentController.js');

// get all comments for a thread
commentRouter.get('/', getThreadComments);

// create new comment
commentRouter.post('/', express.json(), createComment);

module.exports = commentRouter;