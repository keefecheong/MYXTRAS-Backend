// handle routes related to user profile

// initialize router
const express = require("express");
const profileRouter = express.Router();

// get middleware
const {
  multerConfig,
  multerErrorHandler,
} = require("../../middleware/multerMiddleware.js");

// get controller functions
const {
  getUser,
  getRequestedUser,
} = require("../controllers/userProfileController.js");
const {
  updateUser,
  setupUser,
} = require("../controllers/userSaveController.js");

// get current user from cookie
profileRouter.get("/", getUser);

// update user info
profileRouter.patch(
  "/",
  multerConfig.array("selectedImages"),
  multerErrorHandler,
  updateUser,
);

// initial user info setup
profileRouter.patch("/setup", express.json(), setupUser);

// get requested user
profileRouter.get("/:userId", getRequestedUser);

module.exports = profileRouter;
