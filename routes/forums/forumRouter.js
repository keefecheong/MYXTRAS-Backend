const express = require('express');
const Forum = require('../../models/forum.js');
const router = express.Router();
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { uploadImages } = require('../../utils/posts/firebaseStorageUpload.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// Retrieve schools

router.post('/create', multerConfig.array('selectedImages'), validateUserHTTP, async (req, res) => {
    
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    try {
        const formData = req.body;
        const forumObjectString = formData.forumObject;
        const forumObject = JSON.parse(forumObjectString);

        // check if images are provided in the body
        // if provided, continue to create post
        // otherwise return 400 error
        const { forumName, forumID, forumDesc, bannerImageLink, category } = forumObject;
        const newForum = new Forum({
            creator_id: req.user._id,
            forumName: forumName,
            forumID: forumID,
            forumDesc: forumDesc,
            banner_link: bannerImageLink,
            banner_link: [],
            category: category
        });

        const uploadSuccessful = await uploadImages(req.files, newForum.banner_link, newForum.id, 'forum');
        
        await newForum.save();

        if (!uploadSuccessful) {
            await Forum.findByIdAndDelete(newForum.id);
            res.status(500).json({ message: 'Failed to upload images, please try again later.' });
        }
        await newForum.save();
        return res.json();

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/get-forum/', async (req, res) => {
    return res.json({"msg": 'heii'})
});

// Retrieve courses
router.patch('/update-courses', (req, res) => {

    
});

module.exports = router;