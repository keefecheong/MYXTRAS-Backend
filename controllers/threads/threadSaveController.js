// controller functions for creation and update of threads

const Thread = require('../../models/thread.js');

const { uploadImages, UPLOAD_TYPE_THREAD } = require('../../utils/firebase/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/firebase/firebaseStorageDelete.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const { cacheNewThread, updateCachedThread } = require('../../cache/threads/threadUpdateCache.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

// create new thread
async function createThread(req, res) {
    // check if request body is empty
    // if request body is empty return 400 error, otherwise continue to create thread
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    try {
        const threadObject = JSON.parse(req.body.threadObject);
        
        const { title, content, tags } = threadObject;

        const forumId = req.params.forumID;
        const creatorId = req.user._id;

        // create new thread
        const newThread = new Thread({
            parent_id: forumId,
            creator_id: creatorId,
            title: title,
            content: content,
            tags: tags
        });

        // save images if provided
        if (req.files.length > 0) {
            const newImageLinks = [];

            const threadPicUploadSuccessful = await uploadImages(req.files, newImageLinks, newThread._id, UPLOAD_TYPE_THREAD, forumId);
        
            // if upload not successful then delete the new thread
            if (!threadPicUploadSuccessful) {
                return returnServerErrorReq(res);
            }

            newThread.content_link = newImageLinks[0];
        }

        const userDetails = {
            _id: creatorId,
            username: req.user.username,
            profile_pic_link: req.user.profile_pic_link
        }

        const forumDetails = {
            _id: forumId,
            forum_name: res.forum.forum_name,
            forum_id: res.forum.forum_id,
            forum_pic_link: res.forum.forum_pic_link
        }

        // update cache if key exists
        const updateCacheResult = await cacheNewThread(newThread, userDetails, forumDetails);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(newThread, updateCacheResult);

        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// update thread
async function updateThread(req, res) {
    // check if request body is empty
    // if request body is empty return 400 error, otherwise continue to update thread
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    // check if images are provided if 'pictureUnchanged' is not set to 'true'
    // if provided, continue to update thread
    // otherwise return 400 error
    if (req.files.length <= 0 && req.body.pictureUnchanged != 'true') {
        return returnBadReq(res, 'An image is required.');
    }

    // check if the creator of the thread is the requesting user
    // if creator is not the requesting user then return 401 error
    if (!compareId(req.user._id, res.thread.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        const { title, content, tags } = JSON.parse(req.body.threadObject);
        
        // convert thread to mongoose document to perform operations
        const thread = new Thread(res.thread);
        thread.isNew = false;

        const updatedValues = {};

        // update fields and add to updatedValues if changed
        if (title != thread.title) {
            thread.title = title;
            updatedValues.title = title;
        }
        
        if (content != thread.content) {
            thread.content = content;
            updatedValues.content = content;
        }
        
        if (tags != thread.tags) {
            thread.tags = tags;
            updatedValues.tags = tags;
        }

        const forumId = thread.parent_id._id;

        // save image if changed
        if (req.body.pictureUnchanged != 'true') {
            const newImageLinks = [];

            const threadPicUploadSuccessful = await uploadImages(req.files, newImageLinks, thread._id, UPLOAD_TYPE_THREAD, forumId);
        
            // if upload not successful then return 500 error
            if (!threadPicUploadSuccessful) {
                return returnServerErrorReq(res);
            }

            // otherwise delete old image and set new image link
            deleteFiles([thread.content_link]);

            thread.content_link = newImageLinks[0];
            updatedValues.content_link = newImageLinks[0];
        }

        // update cache entry if thread is in cache
        const updateCacheResult = await updateCachedThread(updatedValues, forumId, thread._id, res.threadFromCache);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(thread, updateCacheResult);

        returnNoContentReq(res, { message: 'Thread updated.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    createThread,
    updateThread
}