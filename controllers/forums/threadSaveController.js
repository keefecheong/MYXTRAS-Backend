// controller functions for creation and update of threads

const Thread = require('../../models/thread.js');

const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');
const mongoose = require('mongoose');

// create new thread
const createThread = async (req, res) => {
    // check if request body is empty
    // if request body is empty return 400 error, otherwise continue to create thread
    if (!req.body) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        const threadObject = JSON.parse(req.body.threadObject);
        
        const { title, content, tags } = threadObject;

        const id = new mongoose.Types.ObjectId();

        const newThread = new Thread({
            _id: id,
            parent_id: req.params.forumID,
            creator_id: req.user._id,
            title: title,
            content: content,
            tags: tags
        });

        // save images if provided
        if (req.files.length > 0) {
            const newImageLinks = [];

            const threadPicUploadSuccessful = await uploadImages(req.files, newImageLinks, id, 'thread', req.params.forumID);
        
            // if upload not successful then delete the new thread
            if (!threadPicUploadSuccessful) {
                return res.status(500).json({ message: 'Failed to upload images, please try again later.' });
            }

            newThread.content_link = newImageLinks[0];
        }
        
        await newThread.save();

        res.status(201).end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// update thread
const updateThread = async (req, res) => {
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
        
        const { title, content, tags } = threadObject;

        res.thread.title = title;
        res.thread.content = content;
        res.thread.tags = tags;

        // save images if changed
        if (req.body.pictureUnchanged != 'true') {
            const newImageLinks = [];

            const threadPicUploadSuccessful = await uploadImages(req.files, newImageLinks, res.thread.id, 'thread', res.thread.parent_id);
        
            // if upload not successful then return 500 error
            if (!threadPicUploadSuccessful) {
                return res.status(500).json({ message: 'Failed to upload images, please try again later.' });
            }

            // otherwise delete old image and set new image link
            deleteFiles([res.thread.content_link]);

            res.thread.content_link = newImageLinks[0];
        }

        await res.thread.save();

        res.status(204).end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createThread,
    updateThread
}