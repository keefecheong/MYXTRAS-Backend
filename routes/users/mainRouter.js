// main router to consolidate routers to handle requests related to users

// initialize router
const express = require('express');
const mainRouter = express.Router();
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// nested routers
const userLoginRouter = require('./userLoginRouter.js');
const userProfileRouter = require('./userProfileRouter.js');
const userCookieRouter = require('./userCookieRouter.js');

// mount various routes
// handle user profile related requests
mainRouter.use('/profile', express.json(), userProfileRouter);

// handle login requests
mainRouter.use('/login', userLoginRouter);

// handle cookie requests
mainRouter.use('/cookie', userCookieRouter);

module.exports = mainRouter;