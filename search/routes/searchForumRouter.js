// handle routes related to searching for forums

// initialize router
const express = require('express');
const searchForumRouter = express.Router();

// get controller functions
const { search } = require('../controllers/searchController.js');

// get forums based on search term
searchForumRouter.get('/', (req, res) => search(req, res, 'forum'));

module.exports = searchForumRouter;