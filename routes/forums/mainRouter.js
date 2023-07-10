// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const forumRouter = require('./forumRouter.js');
const subscribeRouter = require('./forumSubscribeRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getForum } = require('../../middleware/forums/getForumMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
mainRouter.use('/subscribe/:forumID', getForum, subscribeRouter);
mainRouter.use('/', forumRouter);

module.exports = mainRouter;