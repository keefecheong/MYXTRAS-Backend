const express = require('express');
const Forum = require('../../models/forum.js');
const User = require('../../models/user.js');

const router = express.Router();
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { uploadImages } = require('../../utils/posts/firebaseStorageUpload.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');
const forum = require('../../models/forum.js');

router.post('/create', multerConfig.array('selectedImages'), async (req, res) => {

    // check if images are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error

    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    try {
        
        const formData = req.body;
        const forumObjectString = formData.forumObject;
        const forumObject = JSON.parse(forumObjectString);
        
        const { forumName, forumID, forumDesc, category } = forumObject;
        
        // Check for existing forum
        if (Forum.find({ forumID: forumID }) === null){
            return res.status(400).json({ error: 'ForumID already exists' });
        }
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
router.post('/subscribe/:forumID', async (req, res) => {

    // Update subbed forums
    User.updateOne(
        { _id: ObjectId(req.user.id) },
        { $push: { subscribed_forums: forumID } }
      )
      .then(() => {
        console.log('String pushed successfully');
        // Handle success
      })
      .catch((error) => {
        console.error('Error pushing string:', error);
        // Handle error
      });

      return res.json();

})
// Retrieve one page
router.get('/get-forum/:forumID', async (req, res) => {
    let forum;
    var isCreator = false;

    try {
        forum = await Forum.findOne({forumID : req.params.forumID});
        if (!forum) {
            return res.status(404).json({ message: 'Unable to find the specified post.' });
        }
        
        // Display Subscribe button in frontend logic
        if (req.user._id.equals(forum.creator_id)){
            isCreator = true
        }
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
    const response = {
        forum: forum,
        isCreator: isCreator,
      };
    res.status(200).json(response);
});
// Retrieve user created forum list
router.get('/get-created-forums/', async (req, res) => {

    try {
        const forums =  await Forum.find({ creator_id: req.user.id }, { forumID: 1, forumName: 1, forum_pic_link: 1 }).exec();
        // Extract the desired fields from the forums
        const result = forums.map(({ forumID, forumName, forum_pic_link }) => ({ forumID, forumName, forum_pic_link }));
        
        // Return the result as a JSON array
        res.status(200).json(result);
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
});
// Retrieve user subscribed forum list
router.get('/get-subbed-forums/', async (req, res) => {
    let forum;

    try {
        forum = await User.findById(req.params.uid).populate({ path: 'subscribed_forums', select: 'forumID profile_pic_link forumName'})
        if (!forum) {
            return res.status(404).json({ message: 'Unable to find the specified post.' });
        }
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
    res.status(200).json(forum);
});

module.exports = router;