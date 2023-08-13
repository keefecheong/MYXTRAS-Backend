// main router to consolidate routes for admins

const express = require("express");
const mainRouter = express.Router();

// nested routers
const adminReportRouter = require("./adminReportRouter.js");
const resolveReportRouter = require("./resolveReportRouter.js");

// mount various routes
// to get reports for admins
mainRouter.use("/", adminReportRouter);

// to resolve reports
mainRouter.use("/resolve", express.json(), resolveReportRouter);

module.exports = mainRouter;
