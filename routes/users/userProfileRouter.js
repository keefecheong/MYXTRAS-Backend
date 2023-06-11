// handle routes related to cookies

// initialize router
const express = require('express');
const profileRouter = express.Router();

// get middleware
const { validateUser } = require('../../middleware/authMiddleware.js');

// get controller functions
const { getUser, registerUser, updateUser, setupUser } = require('../../controllers/users/userProfileController.js');

// get current user from cookie
profileRouter.get('/', validateUser, getUser);

// register new user
profileRouter.post('/', express.json(), registerUser);

// update user info
profileRouter.patch('/', validateUser, express.json(), updateUser);

// initial user info setup
profileRouter.patch('/setup', validateUser, express.json(), setupUser);

module.exports = profileRouter;