const express = require('express');
const Forum = require('../models/forum.js');
const router = express.Router();

// Define a route for search endpoint
router.get('/', async (req, res) => {
const searchTerm = req.query.term;
const regexTerm = new RegExp(searchTerm, 'i');

const topThreeForums = await Forum.find({
  $or: [
    { forumID: { $regex: regexTerm } },
    { forumDesc: { $regex: regexTerm } }
  ]
}).limit(3);

res.status(200).json({ topThreeForums })
});
  
module.exports = router;