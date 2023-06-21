const express = require('express');
const Forum = require('../../models/forum.js');
const User = require('../../models/user.js');

const router = express.Router();
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

router.post('/verify-forumID', express.json(), async (req, res) => {
    const forumID = req.body.forumID
    const existingForum = await Forum.findOne({ forumID: forumID });

    if (existingForum) {
        return res.status(400).json({ error: 'ForumID already exists' });
    }
    else {
        return res.status(200).end()
    }
});
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
// Retrieve one page
router.get('/get-forum/:forumID', async (req, res) => {
    let forum;
    var isSubscribed = false;
    var isCreator = false;
    
    try {
        forum = await Forum.findOne({forumID : req.params.forumID});
        if (!forum) {
            return res.status(404).json({ message: 'Unable to find the specified forum.' });
        }
        // Display Subscribe button in frontend logic
        if (req.user._id.equals(forum.creator_id)){
            isCreator = true
        }
        if (!(req.user.subscribed_forums.indexOf(forum._id) === -1)){
            isSubscribed = true
        }
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
    const response = {
        forum: forum,
        isCreator: isCreator,
        isSubscribed: isSubscribed
      };
    res.status(200).json(response);
});
// Retrieve user created forum list
router.get('/get-created-forums/', async (req, res) => {

    try {
        const forums =  await Forum.
        find({ creator_id: req.user.id }, { forumID: 1, forumName: 1, forum_pic_link: 1 })
        .select('forumID, forumName, forum_pic_link')
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

    const subbed_forums = await User.findById(req.user.id)
    .select('subscribed_forums')
    .populate({
        path: 'subscribed_forums',
        select: 'forumName forumID forum_pic_link threads',
        populate: {
            path: 'threads',
            select: 'thread_title thread_desc numOfComments content_links creation_time',
            populate: {
                path: 'creator_id',
                select: 'username profile_pic_link'
            },
            options: { sort: { creation_time: -1 } }
        }
    })
    .lean()

    // // Step 1: Retrieve the threads from the filtered forums
    // const threads = subbed_forums.subscribed_forums.reduce((result, forum) => {
    //     return result.concat(forum.threads);
    // }, []);
    
    // // Step 2: Flatten the threads array
    // const mergedThreads = [].concat(...threads);
    
    // // Step 3: Sort the merged threads array in chronological order
    // const sortedThreads = mergedThreads.sort((a, b) => {
    //     return new Date(b.creation_time) - new Date(a.creation_time);
    // });
  
    // console.log(sortedThreads);

    // const response = {
    //     subbed_forums,
    //     sortedThreads
    // }
    return res.status(200).json(subbed_forums);
});
// Retrieve 6 popular forums 
router.get('/get-recommended-forums/', async (req, res) => {

    const topSixForums = await Forum.find()
    .select('forumName forumID forum_pic_link numOfSubs')
    .sort({ numOfSubs: -1 })
    .limit(6)
    .lean()

    return res.status(200).json(topSixForums);
});

router.post('/subscribe-forum/:forumID', async (req, res) => {
    let isSubscribed

    // Note: req.param.forumID is the _id instead of forumID field
    try {
        const forum = await Forum.findById(req.params.forumID)

        if (!(req.user.subscribed_forums.indexOf(req.params.forumID) != -1)) {
            
            // Add userid from forum subscribers array list
            forum.subscribers.push(req.user.id);
            await forum.save()

            // Add forumid from forum subscribers array list
            req.user.subscribed_forums.push(req.params.forumID);
            await req.user.save()
              
            isSubscribed = true
            
            return res.status(200).json({"isSubscribed": isSubscribed})
        }
        else {

            // Remove userid from forum subscribers array list
            const userIndex = forum.subscribers.indexOf(req.user.id);
            forum.subscribers.splice(userIndex, 1);

            await forum.save()

            // Remove forumid from user subscribed_forums array list
            const forumIndex = req.user.subscribed_forums.indexOf(req.params.forumID);
            req.user.subscribed_forums.splice(forumIndex, 1);
            await req.user.save()

            isSubscribed = false
            
            return res.status(200).json({"isSubscribed": isSubscribed})
        }
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
})

module.exports = router;