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
    { forum_id: { $regex: regexTerm } },
    { forum_name: { $regex: regexTerm } },
    { forum_desc: { $regex: regexTerm } }
  ]
}).limit(6).select('forum_id forum_name');

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
  }).limit(6).select('real_name username');

  res.status(200).json({ topSixResults })
  });

 // Define a route for search endpoint
router.get('/users-forums', async (req, res) => {
  const searchTerm = req.query.term;
  console.log('test')
  if (searchTerm === '') {
    return res.status(404).json().end();
  }
  const regexTerm = new RegExp(searchTerm, 'i');

  // Fetch top 3 users
  const usersPromise = User.find({
    $or: [
      { username: { $regex: regexTerm } },
      { real_name: { $regex: regexTerm } }
    ]
  })
    .limit(3)
    .select('real_name username')
    .lean();

  // Fetch top 3 forums
  const forumsPromise = Forum.find({
    $or: [
      { forum_id: { $regex: regexTerm } },
      { forum_name: { $regex: regexTerm } },
      { forum_desc: { $regex: regexTerm } }
    ]
  })
    .limit(3)
    .select('forum_id forum_name')
    .lean();
    
  try {
    // Wait for both promises to resolve
    const [users, forums] = await Promise.all([usersPromise, forumsPromise]);

    // Combine and limit the results to top 6
    const combinedResults = [...users, ...forums].slice(0, 6);

    res.status(200).json({ topSixResults: combinedResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}); 
module.exports = router;