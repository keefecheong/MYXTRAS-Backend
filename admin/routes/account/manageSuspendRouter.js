// to suspend/unsuspend a user

const express = require('express');
const manageSuspendRouter = express.Router();

const { suspendUser, unsuspendUser } = require('../../controllers/suspendUserController.js');

// to suspend user
manageSuspendRouter.post('/', express.json(), suspendUser);

// to unsuspend a user
manageSuspendRouter.delete('/', unsuspendUser);

module.exports = manageSuspendRouter;