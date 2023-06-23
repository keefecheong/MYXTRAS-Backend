const express = require('express');
const Forum = require('../../models/forum.js');
const User = require('../../models/user.js');

const { getForum } = require('../../middleware/forums/getForumMiddleware.js');

const router = express.Router();
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

router.post('/verify-forumID', express.json(), async (req, res) => {
    const existingForum = await Forum.findOne({ forumID: req.body.forumID });

    if (existingForum) {
        return res.status(400).json({ error: 'ForumID already exists' });
    }
    else {
        return res.status(200).end()
    }
});

router.post('/create', multerConfig.array('selectedImages'), multerErrorHandler, async (req, res) => {
    // check if images and text fields are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        req.status(400).json({ error: 'Forum pictures are required' });
    }

    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    try {
        const { forumName, forumID, forumDesc, tags } = JSON.parse(req.body.forumObject);

        // Check for existing forum
        const existingForum = await Forum.find({ forumID: forumID });
        
        if (!existingForum){
            return res.status(400).json({ error: 'ForumID already exists' });
        }

        const newForum = new Forum({
            creator_id: req.user._id,
            forumName: forumName,
            forumID: forumID,
            forumDesc: forumDesc,
            tags: tags
        });

        await newForum.save();

        // upload images
        const imageLinks = [];
        const forumPicUploadSuccessful = await uploadImages(req.files, imageLinks, newForum._id, 'forum');

        if (!forumPicUploadSuccessful) {
            await Forum.findByIdAndDelete(newForum._id);
            return res.status(500).json({ message: 'Internal server error' });
        }
        
        // update forum image links
        newForum.forum_pic_link = imageLinks[0];
        newForum.banner_link = imageLinks[1];

        await newForum.save();

        return res.status(201).json({ forumID: newForum._id });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Retrieve one forum
router.get('/get-forum/:forumID', getForum, async (req, res) => {
    const workingForum = res.forum.toObject();
    var isSubscribed = false;
    var isCreator = false;
    
    try {
        // Display Subscribe button in frontend logic
        if (req.user._id.equals(res.forum.creator_id._id)){
            isCreator = true;
        }
        if (res.forum.subscribers.includes(req.user._id)) {
            isSubscribed = true;
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

    workingForum.isCreator = isCreator;
    workingForum.isSubscribed = isSubscribed;

    res.status(200).json(workingForum);
});
// Retrieve user created forum list
router.get('/get-created-forums/', async (req, res) => {

    try {
        const forums =  await Forum
        .find({ creator_id: req.user.id }, { forumID: 1, forumName: 1, forum_pic_link: 1 })
        .select('forumID forumName forum_pic_link')
        .exec();

        // Extract the desired fields from the forums
        //const result = forums.map(({ forumID, forumName, forum_pic_link }) => ({ forumID, forumName, forum_pic_link }));
        
        // Return the result as a JSON array
        res.status(200).json(forums);
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
});
// Retrieve user subscribed forum list
router.get('/get-subbed-forums/', async (req, res) => {
    const subbed_forums = await Forum
        .find({ subscribers: { $in: [req.user._id] } })
        .select('forumName forumID forum_pic_link')
        .lean();

    return res.status(200).json(subbed_forums);
});
// Retrieve 6 popular forums 
router.get('/get-recommended-forums/', async (req, res) => {

    const topSixForums = await Forum.aggregate([
        {
          $addFields: {
            numOfSubs: { $size: "$subscribers" }
          }
        },
        {
          $sort: {
            numOfSubs: -1
          }
        },
        {
          $limit: 6
        },
        {
          $project: {
            forumName: 1,
            forumID: 1,
            forum_pic_link: 1,
            numOfSubs: 1
          }
        }
      ]);

    return res.status(200).json(topSixForums);
});
router.get('/get-popular-forums/', async (req, res) => {

    const sortedForums = await Forum.aggregate([
        {
            $unwind: "$tags" // Unwind the tags array
        },
        {
            $group: {
                _id: "$tags", // Group by each unique tag
                forums: { $push: "$$ROOT" }, // Collect the forums with the same tag into an array
            },
        },
      ]);
    console.log(sortedForums)
    return res.status(200).json(sortedForums);
});
router.post('/subscribe/:forumID', getForum, async (req, res) => {
    try {
        // check if the requesting user has subscribed to the forum already
        const subscribed = res.forum.subscribers.find(creator_id => creator_id.equals(req.user._id));

        if (subscribed) {
            return res.status(400).json({ message: 'You have already subscribed to this forum.' });
        }

        // update forum subscriber list
        res.forum.subscribers.push(req.user._id);

        await res.forum.save();
        res.status(201).end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/subscribe/:forumID', getForum, async (req, res) => {
    try {
        // check if the requesting user has subscribed to the forum already
        const subscribedIndex = res.forum.subscribers.findIndex(creator_id => creator_id.equals(req.user._id));

        // if the user has not subscribed to the forum return 400 error
        if (subscribedIndex == -1) {
            return res.status(400).json({ message: 'You have not subscribed to this forum yet.' });
        }

        // remove user id from the forum subscriber list
        res.forum.subscribers.splice(subscribedIndex, 1);

        await res.forum.save();
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:forumID', multerConfig.array('selectedImages'), getForum, async (req, res) => {
    // check if text fields are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (!req.body) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    // check if images are provided if 'pictureUnchanged' and 'bannerUnchanged' are not set to 'true'
    // if provided, continue to update forum
    // otherwise return 400 error
    if (req.files.length <= 0 && req.body.pictureUnchanged != 'true' && req.body.bannerUnchanged != 'true') {
        return res.status(400).json({ message: 'At least one image is required.' });   
    }

    // check if the creator of the forum is the requesting user
    // if creator is not the requesting user return 401 error
    if (!req.user._id.equals(res.forum.creator_id._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }
    
    try {
        // update fields
        const { forumName, forumID, forumDesc, tags } = JSON.parse(req.body.forumObject);

        res.forum.forumName = forumName;
        res.forum.forumID = forumID;
        res.forum.forumDesc = forumDesc;
        res.forum.tags = tags;

        let index = 0;

        // upload new forum picture if exists
        if (req.body.pictureUnchanged != 'true') {
            var newImageLinks = [];
    
            const uploadSuccessful = await uploadImages([req.files[index]], newImageLinks, req.params.forumID, 'forum');
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return res.status(500).json({ message: 'Failed to update forum, please try again later.' });
            }
    
            // otherwise delete old picture and update forum_pic_link
            deleteFiles([res.forum.forum_pic_link]);
    
            res.forum.forum_pic_link = newImageLinks[0];

            index += 1;
        }

        // upload new forum banner if exists
        if (req.body.bannerUnchanged != 'true') {
            var newImageLinks = [];
    
            const uploadSuccessful = await uploadImages([req.files[index]], newImageLinks, req.params.forumID, 'forum');
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return res.status(500).json({ message: 'Failed to update forum, please try again later.' });
            }
    
            // otherwise delete old picture and update banner_link
            deleteFiles([res.forum.banner_link]);
    
            res.forum.banner_link = newImageLinks[0];
        }

        await res.forum.save();

        res.status(201).end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

module.exports = router;