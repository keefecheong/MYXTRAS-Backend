// handle general forum routes

const express = require("express");
const eventRouter = express.Router();

const {
  multerConfig,
  multerErrorHandler,
} = require("../../middleware/multerMiddleware.js");

const { getAllEvents } = require("../controllers/eventController.js");
const { createEvent } = require("../controllers/eventSaveController.js");

// get all events
eventRouter.get("/", getAllEvents);

// create new event
eventRouter.post(
  "/",
  multerConfig.array("selectedImages"),
  multerErrorHandler,
  createEvent,
);

module.exports = eventRouter;
