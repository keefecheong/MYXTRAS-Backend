const express = require('express');
const router = express.Router();

// get school and course details
router.get('/', (req, res) => {
    const schools = require('../schools.json');

    res.status(200).json(schools);
});

module.exports = router;