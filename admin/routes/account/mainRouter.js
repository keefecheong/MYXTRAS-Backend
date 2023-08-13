// consolidate routes for managing accounts

const express = require("express");
const mainRouter = express.Router({});

// get middleware
const {
  getUser,
} = require("../../../user/middleware/getRequestedUserMiddleware.js");

// nested routers
const manageAdminRouter = require("./manageAdminRouter.js");
const manageSuspendRouter = require("./manageSuspendRouter.js");
const manageTerminateRouter = require("./manageTerminateRouter.js");

// mount routes
// to manage admin role
mainRouter.use("/admin", manageAdminRouter);

// to manage user suspend status
mainRouter.use("/suspend/:userId", getUser, manageSuspendRouter);

// to manage user terminated status
mainRouter.use("/terminate/:userId", getUser, manageTerminateRouter);

module.exports = mainRouter;
