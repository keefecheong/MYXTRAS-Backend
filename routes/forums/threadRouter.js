const express = require('express');
const Forum = require('../../models/forum.js');
const Thread = require('../../models/thread.js');

const router = express.Router();
const { validateUserHTTP } = require('../../middleware/general/authMiddleware.js');
const { uploadImages } = require('../../utils/posts/firebaseStorageUpload.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

router.post('/create/:forumID', multerConfig.array('selectedImages'), async (req, res) => {

    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    console.log(req.params.forumID)
    try {
        
        const formData = req.body;
        const threadObjectString = formData.threadObject;
        const threadObject = JSON.parse(threadObjectString);
        
        const { thread_title, thread_desc, category } = threadObject;

        const newThread = new Thread({
            creator_id: req.user._id,
            thread_title: thread_title,
            thread_desc: thread_desc,
            category: category
        });

        await newThread.save();

        try {
            // populate post data to get creator's username and profile pic link
            const target = await Forum.findOne({forumID: req.params.forumID});
            console.log(target)
            if (!target) {
                return res.status(404).json({ message: 'Unable to find the specified post.' });
            }
            else {  
                target.threads.push(newThread._id);
                await target.save();
            }
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
        // update Forum thread list

        const threadPicUploadSuccessful = await uploadImages([req.files[0]], newThread.content_links, newThread.id, 'thread', req.params.forumID);
        
        if (!threadPicUploadSuccessful) {
            await Forum.findByIdAndDelete(newThread.id);
            res.status(500).json({ message: 'Failed to upload images, please try again later.' });
        }
        await newThread.save();

        return res.json();

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.get('/get-threads/:forumID', async (req, res) => {

    try {
        const threads =  await Forum.findOne({forumID: req.params.forumID})
        .select('threads')
        .populate({ path: 'threads', select: 'thread_title thread_desc content_links numOfComments', populate: {
            path: 'creator_id',
            select: 'username profile_pic_link'
        }})
        .sort({creation_time: 1}).lean()
        res.status(200).json(threads);
    } catch (error) {
        
        return res.status(500).json({ message: error.message });
    }
});
module.exports = router;