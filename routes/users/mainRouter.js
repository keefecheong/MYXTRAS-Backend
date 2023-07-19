// main router to consolidate routers to handle requests related to users

// initialize router
const express = require('express');
const mainRouter = express.Router();

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getUser } = require('../../middleware/users/getRequestedUserMiddleware.js');
const { getPost } = require('../../middleware/posts/getPostMiddleware.js');

// nested routers
const userLoginRouter = require('./userLoginRouter.js');
const userProfileRouter = require('./userProfileRouter.js');
const userCookieRouter = require('./userCookieRouter.js');
const userVerifyRouter = require('./userVerifyRouter.js');
const userRegisterRouter = require('./userRegisterRouter.js');
const userSavePostRouter = require('./userSavePostRouter.js');
const userSpecificRouter = require('./userSpecificRouter.js');

// mount various routes
// handle user profile related requests
mainRouter.use('/profile', validateUserHTTP, express.json(), userProfileRouter);

// handle register user requests
mainRouter.use('/register', express.json(), userRegisterRouter);

// handle login requests
mainRouter.use('/login', express.json(), userLoginRouter);

// handle cookie requests
mainRouter.use('/cookie', validateUserHTTP, userCookieRouter);

// handle verification requests
mainRouter.use('/verify', express.json(), userVerifyRouter);

// handle save post requests
mainRouter.use('/save/user/:userId/post/:postId', validateUserHTTP, getPost, userSavePostRouter);

// handle requests for specific user
mainRouter.use('/:userId', validateUserHTTP, getUser, userSpecificRouter);

module.exports = mainRouter;