// main router to consolidate routes for reporting function

const express = require('express');
const mainRouter = express.Router();

// nested routers
const userReportRouter = require('./userReportRouter.js');
const adminReportRouter = require('./adminReportRouter.js');
const submitReportRouter = require('./submitReportRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware');

// mount various routes
// to get report status for users
mainRouter.use('/user', validateUserHTTP, userReportRouter);

// to get reports for admins
mainRouter.use('/admin', (req, res, next) => validateUserHTTP(req, res, next, true), adminReportRouter);

// to submit reports
mainRouter.use('/submit', validateUserHTTP, submitReportRouter);

module.exports = mainRouter;