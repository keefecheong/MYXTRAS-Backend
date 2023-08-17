// main router to consolidate routers to handle requests related to events

// initialize router
const express = require("express");
const mainRouter = express.Router();

// nested routers
const eventRouter = require("./eventRouter.js");
const eventSpecificRouter = require("./eventSpecificRouter.js");

// mount various routes
mainRouter.use("/", eventRouter);
mainRouter.use("/:eventId", eventSpecificRouter);

module.exports = mainRouter;
