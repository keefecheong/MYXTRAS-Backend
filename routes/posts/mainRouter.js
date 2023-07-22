// main router to consolidate routers to handle requests related to posts

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const postRouter = require('./postRouter.js');
const postSpecificRouter = require('./postSpecificRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getPost } = require('../../middleware/posts/getPostMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
// handle post requests
mainRouter.use('/', postRouter);

// to perform actions on specific posts
mainRouter.use('/user/:userId/post/:postId', getPost, postSpecificRouter);

module.exports = mainRouter;