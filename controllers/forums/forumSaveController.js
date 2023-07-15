// controller functions for creation and update of forums

const mongoose = require('mongoose');
const Forum = require('../../models/forum.js');

const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const { cacheNewForum, updateCachedForum } = require('../../cache/forums/forumUpdateCache.js');

// create a new forum
async function createForum(req, res) {
    // check if images and text fields are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        return returnBadReq(res, 'Forum pictures are required');
    }

    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    try {
        const { forum_name, forum_id, forum_desc, tags } = JSON.parse(req.body.forumObject);

        // Check for existing forum
        const existingForum = await Forum.find({ forum_id: forum_id });
        
        if (!existingForum){
            return returnBadReq(res, 'ForumID already exists');
        }

        // field length validation
        if (forum_name.length > 25 || forum_id.length > 25 || forum_desc.length > 100) {
            return returnBadReq(res, 'Input length too long');
        }

        const forumId = new mongoose.Types.ObjectId();
        const creatorId = req.user._id;

        // create new forum
        const newForum = new Forum({
            _id: forumId,
            creator_id: creatorId,
            forum_name: forum_name,
            forum_id: forum_id,
            forum_desc: forum_desc,
            tags: tags
        });

        // upload images
        const imageLinks = [];
        const forumPicUploadSuccessful = await uploadImages(req.files, imageLinks, forumId, 'forum');

        // if unsuccessful return internal server error
        if (!forumPicUploadSuccessful) {
            return returnServerErrorReq(res);
        }
        
        // update forum image links
        newForum.forum_pic_link = imageLinks[0];
        newForum.banner_link = imageLinks[1];

        const userDetails = {
            _id: creatorId,
            username: req.user.username,
            profile_pic_link: req.user.profile_pic_link
        }

        // update cache
        const updateCacheResult = await cacheNewForum(newForum, userDetails);

        // update database asynchronously if cache is updated successfully, or synchronously otherwise
        await saveDocAsync(newForum, updateCacheResult);

        returnGoodReq(res, { forum_id: forumId });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// edit existing forum
async function updateForum(req, res) {
    const userId = req.user._id;
    const forumId = req.params.forumID;

    // check if text fields are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    // check if images are provided if 'pictureUnchanged' and 'bannerUnchanged' are not set to 'true'
    // if provided, continue to update forum
    // otherwise return 400 error
    if (req.files.length <= 0 && req.body.pictureUnchanged != 'true' && req.body.bannerUnchanged != 'true') {
        return returnBadReq(res, 'Forum picture and banner are required.');
    }

    // check if the creator of the forum is the requesting user
    // if creator is not the requesting user return 401 error
    if (!compareId(userId, res.forum.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }
    
    try {
        // update fields
        const { forum_name, forum_id, forum_desc, tags } = JSON.parse(req.body.forumObject);

        if (forum_name.length > 25 || forum_id.length > 25 || forum_desc.length > 100) {
            return returnBadReq(res, 'Input length too long');
        }

        // convert forum to mongoose document to perform operations
        const forum = new Forum(res.forum);
        forum.isNew = false;

        const updatedValues = {};

        // update fields and add to updatedValues if changed
        if (forum_name != forum.forum_name) {
            forum.forum_name = forum_name;
            updatedValues.forum_name = forum_name;
        }
        
        if (forum_id != forum.forum_id) {
            forum.forum_id = forum_id;
            updatedValues.forum_id = forum_id;
        }
        
        if (forum_desc != forum.forum_desc) {
            forum.forum_desc = forum_desc;
            updatedValues.forum_desc = forum_desc;
        }
        
        if (tags != forum.tags) {
            forum.tags = tags;
            updatedValues.tags = tags;
        }

        let index = 0;

        // upload new forum picture if exists
        if (req.body.pictureUnchanged != 'true') {
            var newImageLinks = [];
    
            const uploadSuccessful = await uploadImages([req.files[index]], newImageLinks, forumId, 'forum');
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }
    
            // otherwise delete old picture and update forum_pic_link
            deleteFiles([forum.forum_pic_link]);
    
            forum.forum_pic_link = newImageLinks[0];
            updatedValues.forum_pic_link = newImageLinks[0];

            index += 1;
        }

        // upload new forum banner if exists
        if (req.body.bannerUnchanged != 'true') {
            var newImageLinks = [];
    
            const uploadSuccessful = await uploadImages([req.files[index]], newImageLinks, forumId, 'forum');
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }
    
            // otherwise delete old picture and update banner_link
            deleteFiles([forum.banner_link]);
    
            forum.banner_link = newImageLinks[0];
            updatedValues.banner_link = newImageLinks[0];
        }

        // update cache entry
        const updateCacheResult = await updateCachedForum(updatedValues, forumId, userId);

        // update database asynchronously if cache is updated successfully, or synchronously otherwise
        await saveDocAsync(forum, updateCacheResult);

        returnGoodReq(res);
    } catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    createForum,
    updateForum
}