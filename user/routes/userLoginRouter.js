// handle routes related to user login

// initialize router
const express = require('express');
const loginRouter = express.Router();

// get controller functions
const { loginUser } = require('../controllers/userLoginController.js');

// handle user login
loginRouter.post('/', loginUser);

module.exports = loginRouter;