const express = require('express');
const Forum = require('../../models/forum.js');
const Thread = require('../../models/thread.js');
const User = require('../../models/user.js');

const { ObjectId } = require('mongodb');

const router = express.Router();
const { getThread } = require('../../middleware/forums/getThreadMiddleware.js');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteImages } = require('../../utils/general/firebaseStorageDelete.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');
const { checkThreadAttributesAll, checkThreadAttributes } = require('../../utils/forums/checkAttributes.js');

// creating a new thread
router.post('/create/:forumObjId', multerConfig.array('picture'), async (req, res) => {
    // check if request body is empty
    // if request body is empty return 400 error, otherwise continue to create thread
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    try {
        const forumObjId = req.params.forumObjId
        const formData = req.body;
        const threadObjectString = formData.threadObject;
        const threadObject = JSON.parse(req.body.threadObject);
        
        const { thread_title, thread_desc, tags } = threadObject;

        const newThread = new Thread({
            parent_id: forumObjId,
            creator_id: req.user._id,
            thread_title: thread_title,
            thread_desc: thread_desc,
            tags: tags
        });

        await newThread.save();


        if (req.files.length > 0) {
            const newImageLinks = [];

            const threadPicUploadSuccessful = await uploadImages(req.files, newImageLinks, newThread._id, 'thread', req.params.forumID);
        
            // if upload not successful then delete the new thread
            if (!threadPicUploadSuccessful) {
                await Thread.findByIdAndDelete(newThread._id);
                res.status(500).json({ message: 'Failed to upload images, please try again later.' });
            }

            newThread.content_links = newImageLinks[0];
            await newThread.save();
        }

        res.status(201).end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// get all threads for explore 
router.get('/get-threads', async (req, res) => {
    try {
        var threads = await Thread.find()
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean();

        threads = checkThreadAttributesAll(threads, req.user._id);

        res.status(200).json(threads);
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
});

// get list of threads for a forum
router.get('/get-threads/:forumID', async (req, res) => {
    try {
        var threads =  await Thread.find({parent_id: req.params.forumID})
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean();

        threads = checkThreadAttributesAll(threads, req.user._id);

        res.status(200).json(threads);
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
});

// get single thread to display on threadView
router.get('/get-thread/:threadID', getThread, async (req, res) => {
    try {
        const thread = checkThreadAttributes(res.thread, req.user._id);

        res.status(200).json(thread);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

});
// Retrieve 6 popular threads 
router.get('/get-popular-threads/', async (req, res) => {

    var threads = await Thread.find()
    .select('thread_title thread_desc content_links')
    .sort({ likes: -1 })
    .limit(6)
    .lean();

    return res.status(200).json(threads);
});

// update thread
router.patch('/:threadID', multerConfig.array('picture'), getThread, async (req, res) => {
    // check if request body is empty
    // if request body is empty return 400 error, otherwise continue to update thread
    if (!req.body) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    // check if images are provided if 'pictureUnchanged' is not set to 'true'
    // if provided, continue to update thread
    // otherwise return 400 error
    if (req.files.length <= 0 && req.body.pictureUnchanged != 'true') {
        return res.status(400).json({ error: 'An image is required.' });
    }

    // check if the creator of the thread is the requesting user
    // if creator is not the requesting user then return 401 error
    if (!req.user._id.equals(res.thread.creator_id._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        const threadObject = JSON.parse(req.body.threadObject);
        
        const { thread_title, thread_desc, tags } = threadObject;

        res.thread.thread_title = thread_title;
        res.thread.thread_desc = thread_desc;
        res.tags = tags;

        // save images if changed
        if (req.body.pictureUnchanged != 'true') {
            const newImageLinks = [];

            const threadPicUploadSuccessful = await uploadImages(req.files, newImageLinks, res.thread.id, 'thread', res.thread.parent_id);
        
            // if upload not successful then return 500 error
            if (!threadPicUploadSuccessful) {
                return res.status(500).json({ message: 'Failed to upload images, please try again later.' });
            }

            // otherwise delete old image and set new image link
            deleteImages([res.thread.content_links]);

            res.thread.content_links = newImageLinks[0];
        }

        await res.thread.save();

        res.status(204).end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/get-recent-threads/', async (req, res) => {

    const forums = await Forum.find({
        $or: [
          { creator_id: req.user.id },
          { subscribers: { $in: [req.user._id] } }
        ]
      }).lean();

    const forumIds = forums.map(forum => forum._id);

    const threads = await Thread.find({ parent_id: { $in: forumIds } })
    .populate('parent_id', 'forumName forumID forum_pic_link')
    .populate('creator_id', 'username')
    .sort({creation_time: -1})
    .lean();
    
    return res.status(200).json(threads);
});
module.exports = router;