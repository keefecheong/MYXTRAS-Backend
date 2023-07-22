// routes to resolve report after viewing (for admins)

const express = require('express');
const resolveReportRouter = express.Router();

// get nested router
const successResolveReportRouter = require('./successResolveReportRouter.js');

// get controller functions
const { reportFailed } = require('../../../controllers/report/resolveReportController.js');

// do nothing (report invalid)
resolveReportRouter.patch('/failed/:objectId', reportFailed);

// report successful - perform appropriate action
resolveReportRouter.use('/success', successResolveReportRouter);

module.exports = resolveReportRouter;