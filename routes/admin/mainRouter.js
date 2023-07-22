// main router to consolidate routes for admins

const express = require('express');
const mainRouter = express.Router();

// nested routers
const reportRouter = require('./report/mainRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware');

// validate admin for all routes
mainRouter.use((req, res, next) => validateUserHTTP(req, res, next, true));

// mount various routes
// for report function
mainRouter.use('/report', reportRouter);

module.exports = mainRouter;