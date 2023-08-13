// handle routes related to following/unfollowing user

const express = require("express");
const followRouter = express.Router();

const {
  followUser,
  unfollowUser,
} = require("../controllers/userFollowController.js");

// follow the user
followRouter.post("/", followUser);

// unfollow the user
followRouter.delete("/", unfollowUser);

module.exports = followRouter;
