const express = require('express');
const Forum = require('../models/forum.js');
const User = require('../models/user.js');
const router = express.Router();

// Define a route for search endpoint
router.get('/forums', async (req, res) => {
const searchTerm = req.query.term;

if (searchTerm === ''){
  return res.status(404).json().end
}
const regexTerm = new RegExp(searchTerm, 'i');

const topSixResults = await Forum.find({
  $or: [
    { forumID: { $regex: regexTerm } },
    { forumName: { $regex: regexTerm } },
    { forumDesc: { $regex: regexTerm } }
  ]
}).limit(6);

res.status(200).json({ topSixResults })
});

// Define a route for search endpoint
router.get('/users', async (req, res) => {
  const searchTerm = req.query.term;
  if (searchTerm === ''){
    return res.status(404).json().end
  }
  const regexTerm = new RegExp(searchTerm, 'i');
  
  const topSixResults = await User.find({
    $or: [
      { username: { $regex: regexTerm } },
      { real_name: { $regex: regexTerm } }
    ]
  }).limit(6);
  
  res.status(200).json({ topSixResults })
  });
  
module.exports = router;