// main router to consolidate routers to handle requests related to threads

// initialize router
const express = require("express");
const mainRouter = express.Router();

// nested routers
const threadRouter = require("./threadRouter.js");
const threadSpecificRouter = require("./threadSpecificRouter.js");

// get middleware
const { validateUserHTTP } = require("../../middleware/authMiddleware.js");
const { getThread } = require("../middleware/getThreadMiddleware.js");

// validate user for all routes
mainRouter.use(validateUserHTTP);

// mount various routes
mainRouter.use("/", threadRouter);
mainRouter.use(
  "/forum/:forumId/thread/:threadId",
  getThread,
  threadSpecificRouter,
);

module.exports = mainRouter;
