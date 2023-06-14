const express = require('express');
const Forum = require('../models/forum.js');
const router = express.Router();

// Define a route for search endpoint
router.get('/', async (req, res) => {

    const searchTerm = req.query.term;
    // const regexTerm = new RegExp(searchTerm, 'i');
    
    // const topThreeForums = await Forum.find(
    //   { $text: { $search: searchTerm } },
    //   { score: { $meta: 'textScore' } }
    // )
    //   .sort({ score: { $meta: 'textScore' } })
    //   .limit(3);
    const topThreeForums = await Forum.find(
        { forumID: { $regex: searchTerm, $options: 'i' } }
      )
        .limit(6);
  
    res.status(200).json({ topThreeForums }); // Return the search results as JSON
  });
  
module.exports = router;