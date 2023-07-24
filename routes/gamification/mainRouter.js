// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();
const dailyCheckInRouter = require('./dailyCheckInRouter.js');
const missionRouter = require('./missionRouter.js');
const gachaponRouter = require('.//gachaponRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
mainRouter.use('/missions', missionRouter);
mainRouter.use('/daily-checkin', dailyCheckInRouter);
mainRouter.use('/gachapon', gachaponRouter);

module.exports = mainRouter;