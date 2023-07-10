// main router to consolidate routers to handle requests related to posts

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const postRouter = require('./postRouter.js');
const postLikeRouter = require('./postLikeRouter.js');
const postCommentRouter = require('./postCommentRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getPost } = require('../../middleware/posts/getPostMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
// handle post requests
mainRouter.use('/', postRouter);

// handle comment requests
mainRouter.use('/comments/user/:userId/post/:postId', getPost, postCommentRouter);

// handle like requests
mainRouter.use('/likes/user/:userId/post/:postId', getPost, postLikeRouter);

module.exports = mainRouter;