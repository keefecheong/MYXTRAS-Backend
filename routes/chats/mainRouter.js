// main router to consolidate routers to handle requests related to posts

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const chatRouter = require('./chatRouter.js');
const chatSpecificRouter = require('./chatSpecificRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
// handle generic chat requests
mainRouter.use('/', chatRouter);

// handle requests for specific chats
mainRouter.use('/:chatId', chatSpecificRouter);

module.exports = mainRouter;