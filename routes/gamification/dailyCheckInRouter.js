// handle routes related to comments under posts

// initialize router
const express = require('express');
const dailyCheckInRouter = express.Router();

// get controller functions
const { checkIn } = require('../../controllers/gamification/checkInController.js')


// checkin
dailyCheckInRouter.get('/', checkIn);


module.exports = dailyCheckInRouter;