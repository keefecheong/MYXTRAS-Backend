// handle routes related to comments under posts

// initialize router
const express = require('express');
const missionRouter = express.Router();

// nested routers
const { getMissions, claimMissions } = require('../../controllers/gamification/gamificationController.js')


// checkin
missionRouter.get('/', getMissions);
missionRouter.post('/:title', claimMissions);

module.exports = missionRouter;