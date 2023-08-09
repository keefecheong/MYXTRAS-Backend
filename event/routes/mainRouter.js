// main router to consolidate routers to handle requests related to events

// initialize router
const express = require('express');
const mainRouter = express.Router();

// nested routers
const eventRouter = require('./eventRouter.js');
const eventSpecificRouter = require('./eventSpecificRouter.js');

// get middleware
const { validateUserHTTP } = require('../../middleware/authMiddleware.js');

// validate admin for all routes
mainRouter.use((req, res, next) => validateUserHTTP(req, res, next, true));

// mount various routes
mainRouter.use('/', eventRouter);
mainRouter.use('/:eventID', eventSpecificRouter);

module.exports = mainRouter;