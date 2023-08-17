// handle general forum routes

const express = require("express");
const eventRouter = express.Router();

const { validateUserHTTP } = require("../../middleware/authMiddleware.js");

const {
  multerConfig,
  multerErrorHandler,
} = require("../../middleware/multerMiddleware.js");

const { getAllEvents } = require("../controllers/eventController.js");
const { createEvent } = require("../controllers/eventSaveController.js");

eventRouter.use(validateUserHTTP);

// get all events
eventRouter.get("/", getAllEvents);

// create new event
eventRouter.post(
  "/",
  multerConfig.array("selectedImages"),
  multerErrorHandler,
  createEvent
);

module.exports = eventRouter;
