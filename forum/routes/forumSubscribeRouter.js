// handle routes for subscribing/unsubscribing to forums

const express = require("express");
const subscribeRouter = express.Router();

const {
  subscribeToForum,
  unsubscribeFromForum,
} = require("../controllers/forumSubscribeController");

// subscribe to forum
subscribeRouter.post("/", subscribeToForum);

// unsubscribe from forum
subscribeRouter.delete("/", unsubscribeFromForum);

module.exports = subscribeRouter;
