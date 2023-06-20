// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const forumRouter = require('./forumRouter.js');
const threadRouter = require('./threadRouter.js');
const commentRouter = require('./threadCommentRouter.js')
const { getForum } = require('../../middleware/forums/getForumMiddleware.js');
const { getThread } = require('../../middleware/forums/getThreadMiddleware.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
// handle forum creation requests
mainRouter.use('/', forumRouter);
mainRouter.use('/thread/', threadRouter);
mainRouter.use('/comments/:threadID', getThread, commentRouter);

module.exports = mainRouter;