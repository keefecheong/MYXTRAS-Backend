// to handle requests for individual forums

const express = require("express");
const eventSpecificRouter = express.Router({ mergeParams: true });

// get middleware
const {
  multerConfig,
  multerErrorHandler,
} = require("../../middleware/multerMiddleware.js");

// get controllers
const { updateEvent } = require("../controllers/eventSaveController.js");
const { deleteEvent } = require("../controllers/eventDeleteController.js");

// update event
eventSpecificRouter.patch(
  "/",
  multerConfig.array("selectedImages"),
  multerErrorHandler,
  updateEvent,
);

// delete event
eventSpecificRouter.delete("/", deleteEvent);

module.exports = eventSpecificRouter;
