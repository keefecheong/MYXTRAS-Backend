// handle routes related to saving posts

// initialize router
const express = require('express');
const saveRouter = express.Router();

// get controller functions
const { savePost, removeSavedPost } = require('../controllers/postSaveController.js');

// to save a post
saveRouter.post('/', savePost);

// to remove a saved post
saveRouter.delete('/', removeSavedPost);

module.exports = saveRouter;