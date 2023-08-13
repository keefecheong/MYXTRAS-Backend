// main router to consolidate routes for reporting function for normal users

const express = require("express");
const mainRouter = express.Router();

// nested routers
const userReportRouter = require("./userReportRouter.js");
const submitReportRouter = require("./submitReportRouter.js");

// get middleware
const { validateUserHTTP } = require("../../middleware/authMiddleware.js");

mainRouter.use(validateUserHTTP);

// mount various routes
// to get report status for users
mainRouter.use("/user", userReportRouter);

// to submit reports
mainRouter.use("/submit", express.json(), submitReportRouter);

module.exports = mainRouter;
