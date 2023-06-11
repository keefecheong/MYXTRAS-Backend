const express = require('express');
const School = require('../models/schools.js');
const router = express.Router();
// Retrieve schools

router.get('/get-schools/:id', async (req, res) => {
    // School.findById(documentId, { _id: 0 }, (err, document) => {
    //     if (err) {
    //       console.error('Failed to retrieve document:', err);
    //     } else {
    //       console.log('Document without _id:', document);
    //     }
    //   });
    const id = req.params.id;
    try {
        const school = await School.findOne({});
    
        if (!school) {
          return res.status(404).json({ error: 'School not found' });
        }
    
        const identifier = school.identifier[0][id];
        return res.json({ identifier });
      } catch (error) {
        console.error('Error retrieving school:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
});

// Retrieve courses
router.get('/get-courses/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const school = await School.findOne({});
        if (!school) {
          return res.status(404).json({ error: 'School not found' });
        }
    
        const courseList = school.courses[0][id];
        console.log(courseList)
        return res.json({ courseList });
      } catch (error) {
        console.error('Error retrieving courses:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
});

// Retrieve courses
router.patch('/update-courses', (req, res) => {

    
});

module.exports = router;