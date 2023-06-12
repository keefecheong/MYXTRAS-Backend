const express = require('express');
const Forum = require('../../models/forum.js');
const router = express.Router();
const { validateUserSocket } = require('../../middleware/general/authMiddleware.js');

// Retrieve schools

router.post('/createForum', validateUserSocket, express.json(), async (req, res) => {
    
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    try {
        const { forumName, forumID, forumDesc, bannerImageLink } = req.body;
        const newForum = new Forum({
            creator_id: req.user._id,
            forumName: forumName,
            forumID: forumID,
            forumDesc: forumDesc,
            banner_link: bannerImageLink,
        });

        await newForum.save();

        return res.json();

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Retrieve courses
router.get('/get-forum/', async (req, res) => {
    return res.json({"msg": 'heii'})
});

// Retrieve courses
router.patch('/update-courses', (req, res) => {

    
});

module.exports = router;