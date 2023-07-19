// handle routes for individual posts

const express = require('express');
const postSpecificRouter = express.Router();

// get nested routers
const postLikeRouter = require('./postLikeRouter.js');
const postCommentRouter = require('./postCommentRouter.js');

// mount routes
// handle comment requests
postSpecificRouter.use('/comments', postCommentRouter);

// handle like requests
postSpecificRouter.use('/likes', postLikeRouter);

module.exports = postSpecificRouter;