// controller functions for creation and update of forums

const Forum = require('../../models/forum.js');

const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');

// create a new forum
const createForum = async (req, res) => {
    // check if images and text fields are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        return req.status(400).json({ error: 'Forum pictures are required' });
    }

    if (!req.body) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        const { forum_name, forum_id, forum_desc, tags } = JSON.parse(req.body.forumObject);

        // Check for existing forum
        const existingForum = await Forum.find({ forumID: forum_id });
        
        if (!existingForum){
            return res.status(400).json({ error: 'ForumID already exists' });
        }

        const newForum = new Forum({
            creator_id: req.user._id,
            forum_name: forum_name,
            forum_id: forum_id,
            forum_desc: forum_desc,
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

        return res.status(201).json({ forum_id: newForum._id });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// edit existing forum
const updateForum = async (req, res) => {
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
        return res.status(400).json({ message: 'Forum picture and banner are required.' });   
    }

    // check if the creator of the forum is the requesting user
    // if creator is not the requesting user return 401 error
    if (!req.user._id.equals(res.forum.creator_id._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }
    
    try {
        // update fields
        const { forum_name, forum_id, forum_desc, tags } = JSON.parse(req.body.forumObject);

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
}

module.exports = {
    createForum,
    updateForum
}