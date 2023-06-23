// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const forumRouter = require('./forumRouter.js');
const threadRouter = require('./threadRouter.js');
const commentRouter = require('./threadCommentRouter.js')
const likeRouter = require('./threadLikeRouter.js')
const dislikeRouter = require('./threadDislikeRouter.js')

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getForum } = require('../../middleware/forums/getForumMiddleware.js');
const { getThread } = require('../../middleware/forums/getThreadMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
// handle forum creation requests
mainRouter.use('/', forumRouter);
mainRouter.use('/thread/', threadRouter);
mainRouter.use('/thread/like/:threadID', getThread, likeRouter);
mainRouter.use('/thread/dislike/:threadID', getThread, dislikeRouter);
mainRouter.use('/comments/:threadID', getThread, commentRouter);

module.exports = mainRouter;