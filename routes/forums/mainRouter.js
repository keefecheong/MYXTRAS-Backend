// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const forumRouter = require('./forumRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
// handle forum creation requests
mainRouter.use('/', forumRouter);

module.exports = mainRouter;