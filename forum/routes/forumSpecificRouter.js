// to handle requests for individual forums

const express = require("express");
const forumSpecificRouter = express.Router({ mergeParams: true });

// get nested routers
const subscribeRouter = require("./forumSubscribeRouter.js");

// get middleware
const {
  multerConfig,
  multerErrorHandler,
} = require("../../middleware/multerMiddleware.js");

// get controllers
const { getOneForum } = require("../controllers/forumController.js");
const { updateForum } = require("../controllers/forumSaveController.js");
const { deleteForum } = require("../controllers/forumDeleteController.js");

// mount routes
forumSpecificRouter.use("/subscribe", subscribeRouter);

// get one forum
forumSpecificRouter.get("/", getOneForum);

// update forum
forumSpecificRouter.patch(
  "/",
  multerConfig.array("selectedImages"),
  multerErrorHandler,
  updateForum,
);

// delete forum
forumSpecificRouter.delete("/", deleteForum);

module.exports = forumSpecificRouter;
