// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();
const dailyCheckInRouter = require('./dailyCheckInRouter.js');
const missionRouter = require('./missionRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getUser } = require('../../middleware/users/getRequestedUserMiddleware.js');

const { getGameData} = require('../../middleware/gamification/getGamificationDataMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
mainRouter.use('/missions', missionRouter);
mainRouter.use('/daily-checkin', dailyCheckInRouter);

module.exports = mainRouter;