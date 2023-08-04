// handle routes related to comments under posts

// initialize router
const express = require('express');
const dailyCheckInRouter = express.Router();

// get controller functions
const { getCheckInData, checkIn} = require('../controllers/checkInController.js')

// checkin
dailyCheckInRouter.get('/', getCheckInData);
dailyCheckInRouter.post('/', checkIn);

module.exports = dailyCheckInRouter;