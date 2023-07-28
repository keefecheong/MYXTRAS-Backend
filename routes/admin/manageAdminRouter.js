// router for requests to manage admin status

const express = require('express');
const manageAdminRouter = express.Router();

// get middleware
const { getUser } = require('../../middleware/users/getRequestedUserMiddleware.js');

// get controllers
const { getAllUsers } = require('../../controllers/users/userProfileController.js');
const { promoteAdmin, demoteAdmin } = require('../../controllers/admin/manageAdminController.js');

// mount various routes
// to get list of users
manageAdminRouter.get('/', getAllUsers);

// promote a user to an admin
manageAdminRouter.post('/:userId', getUser, promoteAdmin);

// demote an admin to a user
manageAdminRouter.delete('/:userId', getUser, demoteAdmin);

module.exports = manageAdminRouter;