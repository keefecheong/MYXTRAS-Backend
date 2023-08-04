// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const forumRouter = require('./forumRouter.js');
const forumSpecificRouter = require('./forumSpecificRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/authMiddleware.js');
const { getForum } = require('../middleware/getForumMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
mainRouter.use('/', forumRouter);
mainRouter.use('/:forumID', getForum, forumSpecificRouter);

module.exports = mainRouter;