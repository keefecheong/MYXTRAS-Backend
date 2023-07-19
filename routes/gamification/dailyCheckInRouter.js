// handle routes related to comments under posts

// initialize router
const express = require('express');
const dailyCheckInRouter = express.Router();

// get controller functions
const { getCheckIn, checkIn} = require('../../controllers/gamification/checkInController.js')


// checkin
dailyCheckInRouter.get('/', getCheckIn);
dailyCheckInRouter.post('/', checkIn);

module.exports = dailyCheckInRouter;