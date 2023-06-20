// handle routes related to cookies

// initialize router
const express = require('express');
const profileRouter = express.Router();

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');


// get controller functions
const { getUser, registerUser, updateUser, setupUser, getAllUsers } = require('../../controllers/users/userProfileController.js');

// get current user from cookie
profileRouter.get('/', validateUserHTTP, getUser);

// register new user
profileRouter.post('/', express.json(), registerUser);

// update user info
profileRouter.patch('/', validateUserHTTP, multerConfig.array('selectedImages'), updateUser);

// initial user info setup
profileRouter.patch('/setup', validateUserHTTP, express.json(), setupUser);

// get all users except for self
profileRouter.get('/all', validateUserHTTP, getAllUsers);

module.exports = profileRouter;