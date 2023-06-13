const express = require('express');
const Forum = require('../../models/forum.js');
const User = require('../../models/user.js');

const router = express.Router();
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { uploadImages } = require('../../utils/posts/firebaseStorageUpload.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');
const forum = require('../../models/forum.js');

// Retrieve schools

router.post('/create', multerConfig.array('selectedImages'), async (req, res) => {
    
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
        const { forumName, forumID, forumDesc, category } = forumObject;
        const newForum = new Forum({
            creator_id: req.user._id,
            forumName: forumName,
            forumID: forumID,
            forumDesc: forumDesc,
            category: category
        });

        await newForum.save();
        
        const forumPicUploadSuccessful = await uploadImages([req.files[0]], newForum.forum_pic_link, newForum.id, 'forum');
        
        if (!forumPicUploadSuccessful) {
            await Forum.findByIdAndDelete(newForum.id);
            res.status(500).json({ message: 'Failed to upload images, please try again later.' });
        }
        await newForum.save();

        const bannerUploadSuccessful = await uploadImages([req.files[1]], newForum.banner_link, newForum.id, 'forum');
        
        if (!bannerUploadSuccessful) {
            await Forum.findByIdAndDelete(newForum.id);
            res.status(500).json({ message: 'Failed to upload images, please try again later.' });
        }
        await newForum.save();

        return res.json();

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Retrieve one page
router.get('/get-forum/:forumID', async (req, res) => {
    let forum;

    try {
        forum = await Forum.findOne({forumID : req.params.forumID});
        if (!forum) {
            return res.status(404).json({ message: 'Unable to find the specified post.' });
        }
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
    res.status(200).json(forum);
});

// Retrieve user subscribed forum list
router.get('/get-forum/:uid', async (req, res) => {
    let forum;

    try {
        forum = await User.findById(req.params.uid).populate({ path: 'subscribed_forums', select: 'banner_link profile_pic_link'})
        if (!forum) {
            return res.status(404).json({ message: 'Unable to find the specified post.' });
        }
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
    res.status(200).json(forum);
});
// Retrieve courses
router.patch('/update-courses', (req, res) => {

    
});

module.exports = router;