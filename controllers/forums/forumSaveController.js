// controller functions for creation and update of forums

const Forum = require('../../models/forum.js');

const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');
const mongoose = require('mongoose');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

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
        if (forum_id.length > 25){
            return returnBadReq(res, 'Forum ID is too long');
        }

        if (forum_name.length > 50){
            return returnBadReq(res, 'Forum Name is too long');
        }

        if (forum_desc.length > 250){
            return returnBadReq(res, 'Forum Name is too long');
        }

        const id = new mongoose.Types.ObjectId();

        // create new forum
        const newForum = new Forum({
            _id: id,
            creator_id: req.user._id,
            forum_name: forum_name,
            forum_id: forum_id,
            forum_desc: forum_desc,
            tags: tags
        });

        // upload images
        const imageLinks = [];
        const forumPicUploadSuccessful = await uploadImages(req.files, imageLinks, id, 'forum');

        // if unsuccessful return internal server error
        if (!forumPicUploadSuccessful) {
            return returnServerErrorReq(res);
        }
        
        // update forum image links
        newForum.forum_pic_link = imageLinks[0];
        newForum.banner_link = imageLinks[1];

        await newForum.save();

        returnGoodReq(res, { forum_id: id });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// edit existing forum
async function updateForum(req, res) {
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
    if (!req.user._id.equals(res.forum.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }
    
    try {
        // update fields
        const { forum_name, forum_id, forum_desc, tags } = JSON.parse(req.body.forumObject);

        if (forum_name.length > 25 || forum_id.length > 25 || forum_desc.length > 100) {
            return returnBadReq(res, 'Input length too long');
        }

        res.forum.forum_name = forum_name;
        res.forum.forum_id = forum_id;
        res.forum.forum_desc = forum_desc;
        res.forum.tags = tags;

        let index = 0;

        // upload new forum picture if exists
        if (req.body.pictureUnchanged != 'true') {
            var newImageLinks = [];
    
            const uploadSuccessful = await uploadImages([req.files[index]], newImageLinks, req.params.forumID, 'forum');
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
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
                return returnServerErrorReq(res);
            }
    
            // otherwise delete old picture and update banner_link
            deleteFiles([res.forum.banner_link]);
    
            res.forum.banner_link = newImageLinks[0];
        }

        await res.forum.save();

        returnGoodReq(res);
    } catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    createForum,
    updateForum
}