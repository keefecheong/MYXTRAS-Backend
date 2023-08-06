// handle routes related to comments under posts

// initialize router
const express = require('express');
const petsRouter = express.Router();

// nested routers
const { selectPet } = require('../controllers/petsController.js')


// checkin
// petsRouter.get('/', getMissions);
petsRouter.post('/:pet', selectPet);

module.exports = petsRouter;