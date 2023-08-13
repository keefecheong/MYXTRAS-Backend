// handle routes related to likes under posts

// initialize router
const express = require("express");
const likeRouter = express.Router();

// get controller functions
const {
  postLike,
  deleteLike,
} = require("../controllers/postLikeController.js");

// to add a like
likeRouter.post("/", postLike);

// to remove a like
likeRouter.delete("/", deleteLike);

module.exports = likeRouter;
