// handle general forum routes

const express = require('express');
const forumRouter = express.Router();

const { getForum } = require('../../middleware/forums/getForumMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

const { verifyForumID, getOneForum, getCreated, getSubscribed, getRecommended, getCategorized, deleteForum } = require('../../controllers/forums/forumController.js');
const { createForum, updateForum } = require('../../controllers/forums/forumSaveController.js');

// get forums created by the user
forumRouter.get('/created', getCreated);

// get forums subscribed by the user
forumRouter.get('/subscribed', getSubscribed);

// get categorized forums
forumRouter.get('/categorized', getCategorized);

// get recommended forums
forumRouter.get('/recommended', getRecommended);

// get one forum
forumRouter.get('/:forumID', getForum, getOneForum);

// create new forum
forumRouter.post('/', multerConfig.array('selectedImages'), multerErrorHandler, createForum);

// verify if forum_id is already taken
forumRouter.post('/verify-forumID', express.json(), verifyForumID);

// update forum
forumRouter.patch('/:forumID', multerConfig.array('selectedImages'), multerErrorHandler, getForum, updateForum);

// delete forum
forumRouter.delete('/:forumID', getForum, deleteForum);

module.exports = forumRouter;