// router for requests to manage admin status

const express = require('express');
const manageAdminRouter = express.Router();

// get controllers
const { promoteAdmin, demoteAdmin } = require('../../controllers/admin/manageAdminController.js');

// mount various routes
// promote a user to an admin
manageAdminRouter.post('/', promoteAdmin);

// demote an admin to a user
manageAdminRouter.delete('/', demoteAdmin);

module.exports = manageAdminRouter;