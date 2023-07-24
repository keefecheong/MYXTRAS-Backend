// handle routes related to comments under posts

// initialize router
const express = require('express');
const gachaponRouter = express.Router();

// get controller functions
const { getGemsAndPets, rollGacha} = require('../../controllers/gamification/gachaponController.js')

// checkin
gachaponRouter.get('/', getGemsAndPets);
gachaponRouter.post('/', rollGacha);

module.exports = gachaponRouter;