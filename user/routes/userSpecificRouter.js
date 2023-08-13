// to handle routes for individual users

const express = require("express");
const userSpecificRouter = express.Router();

// get nested routers
const userFollowRouter = require("./userFollowRouter.js");
const userBlockRouter = require("./userBlockRouter.js");

// mount routes
// handle follow requests
userSpecificRouter.use("/follow", userFollowRouter);

// handle block user requests
userSpecificRouter.use("/block", userBlockRouter);

module.exports = userSpecificRouter;
