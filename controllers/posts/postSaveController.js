// controller functions to handle POST and PATCH requests for posts

const Post = require('../../models/post.js');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');
const mongoose = require('mongoose');

// create a post
const createPost = async (req, res) => {
    // check if images are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        return res.status(400).json({ message: 'At least one image is required.' });
    }

    const post = new Post({
        creator_id: req.user._id,
        content_links: [],
        original_names: req.files.map(image => image.originalname)
    });

    // check if there is request body (data for other fields)
    if (req.body) {
        if (req.body.caption) {
            post.caption = req.body.caption;
        }

        if (req.body.location) {
            post.location = req.body.location;
        }

        if (req.body.commentsEnabled) {
            post.comments_enabled = req.body.commentsEnabled == 'true';
        }

        if (req.body.tags) {
            post.tags = req.body.tags;
        }
    }

    try {
        // create new ObjectID
        const id = new mongoose.Types.ObjectId();
        
        // upload images and store the links in content_links of the new post
        const uploadSuccessful = await uploadImages(req.files, post.content_links, id, 'post');

        // if failed to upload images then return error message
        if (!uploadSuccessful) {
            return res.status(500).json({ message: 'Failed to upload images, please try again later.' });
        }

        await post.save();

        res.status(200).json({ message: 'Post created.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const updatePost = async (req, res) => {
    // check if there is request body provided
    // if no request body is present return 400 error
    // otherwise continue to update post
    if (!req.body) {
        return res.status(400).json({ message: 'At least one field is required.' });
    }

    // check if images are provided in the body
    // if provided, continue to update post,
    // otherwise, if 'noFilesChanged' field is provided and set to true, continue to update post
    // otherwise return 400 error
    if (req.files.length <= 0 && req.body.noFilesChanged != 'true') {
        return res.status(400).json({ message: 'At least one image is required.' });   
    }

    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (!req.user._id.equals(res.post.creator_id._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    // update fields
    if (req.body.caption) {
        res.post.caption = req.body.caption;
    }

    if (req.body.location) {
        res.post.location = req.body.location;
    }

    if (req.body.commentsEnabled) {
        res.post.comments_enabled = req.body.commentsEnabled == 'true';
    }

    if (req.body.tags) {
        res.post.tags = req.body.tags;
    }

    try {
        // upload new images and update post if provided
        if (req.body.noFilesChanged != 'true') {
            var newImageLinks = [];
    
            const uploadSuccessful = await uploadImages(req.files, newImageLinks, req.params.postId, 'post');
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return res.status(500).json({ message: 'Failed to update post, please try again later.' });
            }
    
            // otherwise delete old images, update content_links and save the post
            deleteFiles(res.post.content_links);
    
            res.post.content_links = newImageLinks;
            res.post.original_names = req.files.map(image => image.originalname);
        }

        // update last modified time
        res.post.last_modified_time = Date.now();
        
        await res.post.save();

        res.status(200).json({ message: 'Post updated.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createPost,
    updatePost
}