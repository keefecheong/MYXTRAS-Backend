// to terminate/unterminate a user

const express = require('express');
const manageTerminateRouter = express.Router();

const { terminateUser, unterminateUser } = require('../../controllers/terminateUserController.js');

// to terminate user
manageTerminateRouter.post('/', terminateUser);

// to unterminate a user
manageTerminateRouter.delete('/', unterminateUser);

module.exports = manageTerminateRouter;