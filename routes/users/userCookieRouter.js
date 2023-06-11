// handle routes related to cookies

// initialize router
const express = require('express');
const cookieRouter = express.Router();

// get middleware
const { validateUser } = require('../../middleware/authMiddleware.js');

// get controller functions
const { verifyCookie, clearCookie } = require('../../controllers/users/userCookieController.js');

// to verify jwt cookie
cookieRouter.get('/verify', validateUser, verifyCookie);

// to clear jwt cookie
cookieRouter.get('/remove', clearCookie);

module.exports = cookieRouter;