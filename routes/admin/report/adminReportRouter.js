// to get reports (viewed by admins only)

const express = require('express');
const adminReportRouter = express.Router();

const { getPendingReports, getReviewedReports } = require('../../../controllers/report/adminReportController.js');

// to get pending reports
adminReportRouter.get('/pending', getPendingReports);

// to get reviewed reports
adminReportRouter.get('/reviewed', getReviewedReports);

module.exports = adminReportRouter;