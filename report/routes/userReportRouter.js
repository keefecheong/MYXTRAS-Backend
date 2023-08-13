// to get reports for users

const express = require("express");
const userReportRouter = express.Router();

const {
  getSubmittedReports,
} = require("../controllers/userReportController.js");

// to get submitted reports
userReportRouter.get("/submitted", getSubmittedReports);

module.exports = userReportRouter;
