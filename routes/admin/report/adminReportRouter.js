// to get reports (viewed by admins only)

const express = require('express');
const adminReportRouter = express.Router();

const { getUser } = require('../../../middleware/users/getRequestedUserMiddleware.js');
const { getMessage } = require('../../../middleware/messages/getMessageMiddleware.js');

const { getPendingReports, getReviewedReports, getReportsByUser, getReportForUser } = require('../../../controllers/report/adminReportController.js');
const { getReportMessages } = require('../../../controllers/chats/chatMessageController.js');

// to get pending reports
adminReportRouter.get('/pending', getPendingReports);

// to get reviewed reports
adminReportRouter.get('/reviewed', getReviewedReports);

// to get reports created by a specified user
adminReportRouter.get('/by/:userId', getUser, getReportsByUser);

// to get reports submitted against a specified user's content
adminReportRouter.get('/for/:userId', getUser, getReportForUser);

// to get messages to view in admin panel
adminReportRouter.get('/user/:userId/messages/:messageId', getMessage, getReportMessages);

module.exports = adminReportRouter;