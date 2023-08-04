// handle routes related to searching for users

// initialize router
const express = require('express');
const searchUserRouter = express.Router();

// get controller functions
const { search } = require('../controllers/searchController.js');

// get users based on search term
searchUserRouter.get('/', (req, res) => search(req, res, 'user'));

module.exports = searchUserRouter;