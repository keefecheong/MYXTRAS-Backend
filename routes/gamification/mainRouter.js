// main router to consolidate routers to handle requests related to forums

// initialize router
const express = require('express');
const mainRouter = express.Router();
const dailyCheckInRouter = require('./dailyCheckInRouter.js');

// nested routers
const { getMissions } = require('../../controllers/gamification/gamificationController.js')


// get middleware
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { getUser } = require('../../middleware/users/getRequestedUserMiddleware.js');

const { getGameData} = require('../../middleware/gamification/getGamificationDataMiddleware.js');

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
mainRouter.use('/missions', getGameData, getMissions);
mainRouter.use('/daily-checkin', getGameData, dailyCheckInRouter);

module.exports = mainRouter;