// handle routes related to user profile

// initialize router
const express = require('express');
const profileRouter = express.Router();

// get middleware
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');


// get controller functions
const { getUser, updateUser, setupUser, getRequestedUser, getAllUsers } = require('../../controllers/users/userProfileController.js');

// get current user from cookie
profileRouter.get('/', getUser);

// update user info
profileRouter.patch('/', multerConfig.array('selectedImages'), multerErrorHandler, updateUser);

// initial user info setup
profileRouter.patch('/setup', express.json(), setupUser);

// get all users except for self
profileRouter.get('/all', getAllUsers);

// get requested user
profileRouter.get('/:userId', getRequestedUser);

module.exports = profileRouter;