const express = require('express');
const Forum = require('../../models/forum.js');
const Thread = require('../../models/thread.js');
const { ObjectId } = require('mongodb');

const router = express.Router();
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// creating a new thread
router.post('/create/:forumObjId', multerConfig.array('selectedImages'), async (req, res) => {

    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    try {
        const forumObjId = req.params.forumObjId
        const formData = req.body;
        const threadObjectString = formData.threadObject;
        const threadObject = JSON.parse(threadObjectString);
        
        const { thread_title, thread_desc, tags } = threadObject;

        const newThread = new Thread({
            parent_id: forumObjId,
            creator_id: req.user._id,
            thread_title: thread_title,
            thread_desc: thread_desc,
            tags: tags
        });

        await newThread.save();
        if (req.files.length > 0) {
            const threadPicUploadSuccessful = await uploadImages([req.files[0]], newThread.content_links, newThread.id, 'thread', req.params.forumID);
        
            if (!threadPicUploadSuccessful) {
                await Forum.findByIdAndDelete(newThread.id);
                res.status(500).json({ message: 'Failed to upload images, please try again later.' });
            }
            await newThread.save();
        }

        return res.json();

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// get list of forum threads
router.get('/get-threads/:forumObjId', async (req, res) => {
    try {
        const threads =  await Thread.find({parent_id: req.params.forumObjId})
        .select('thread_title thread_desc content_links numOfComments creation_time tags')
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean()

        res.status(200).json(threads);
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
});

// get single thread to display on threadView
router.get('/get-thread/:threadID', async (req, res) => {
    try {
        const threadID = new ObjectId(req.params.threadID)
        const thread =  await Thread.findById({_id: threadID})
        .populate({
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .populate({
            path: 'parent_id',
            select: 'forumID forum_pic_link banner_link'
        })
        .populate({
            path: 'comments',
            populate: {
                path: 'creator_id',
                select: 'username profile_pic_link'
            }
        })
        .lean();
        // Stores thread attributes
        const userId = req.user._id;
        thread.isOwner = thread.creator_id._id.equals(userId);
        thread.liked = thread.likes.some(creator_id => creator_id.equals(userId));
        thread.disliked = thread.dislikes.some(creator_id => creator_id.equals(userId));

        res.status(200).json(thread);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

});
// get all threads for explore 
router.get('/get-threads', async (req, res) => {
    try {
        const threads =  await Thread.find()
        .select('thread_title thread_desc content_links creation_time creator_id numOfComments tags')
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean()

        res.status(200).json(threads);
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
});
// Retrieve 6 popular threads 
router.get('/get-popular-threads/', async (req, res) => {

    const topSixThreads = await Thread.find({})
    .select('thread_title thread_desc content_links')
    .sort({ likes: -1 })
    .limit(6)
    .lean()
    return res.status(200).json(topSixThreads);
});
module.exports = router;