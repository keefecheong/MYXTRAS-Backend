// main router to consolidate routers to handle requests related to threads

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const threadRouter = require('./threadRouter.js');
const commentRouter = require('./threadCommentRouter.js')
const likeRouter = require('./threadLikeRouter.js')
const dislikeRouter = require('./threadDislikeRouter.js')

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getThread } = require('../../middleware/threads/getThreadMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
mainRouter.use('/', threadRouter);
mainRouter.use('/forum/:forumID/thread/:threadID/like', getThread, likeRouter);
mainRouter.use('/forum/:forumID/thread/:threadID/dislike', getThread, dislikeRouter);
mainRouter.use('/forum/:forumID/thread/:threadID/comments', getThread, commentRouter);

module.exports = mainRouter;