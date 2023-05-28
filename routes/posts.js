const express = require('express');
const router = express.Router();
const Post = require('../models/post.js');
const Comment = require('../models/comment.js');
const User = require('../models/user.js');
const multer = require('multer');
const crypto = require('crypto');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

const firebaseStorage = getStorage();

// set up multer to validate images
const acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
const maxImageSize = 2 * 1024 * 1024;
const maxImageCount = 10;

const multerConfig = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: maxImageCount,
        fileSize: maxImageSize
    },
    fileFilter: function(req, file, callback) {
        if (acceptedFileTypes.indexOf(file.mimetype) != -1) {
            callback(null, true);
        }
        else {
            return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file), false);
        }
    }
});

const multerErrorHandler = function(error, req, res, next) {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ message: `Illegal file type, allowed file types: ${acceptedFileTypes.join(', ')}` });
        }
        else if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: `File is too large, maximum file size is ${maxImageSize / 1024 / 1024}MB.` });
        }
        else if (error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({ message: `File limit reached, up to ${maxImageCount} files are allowed.` });
        }
    }

    next();
}

// retrieve all posts
router.get('/', async (req, res) => {
    try {
        // populate post data to get creator's username and profile pic link
        var posts = await Post.find().populate({ path: 'creator_id', select: 'username profile_pic_link'});
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// retrieve all posts by users followed
router.get('/following/:userId', async (req, res) => {
    try {
        const target = await User.findById(req.params.userId);

        if (!target) {
            return res.status(404).json({ message: 'Unable to find the specified user.' });
        }

        let posts = []

        if (target.following.length > 0) {
            // populate post data to get creator's username and profile pic link
            posts = await Post.where('creator_id').in(target.following).populate({ path: 'creator_id', select: 'username profile_pic_link'});
        }

        res.status(200).json(posts);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// retrieve a post by id
router.get('/:postId', getPost, async (req, res) => {
    res.status(200).json(res.post);
});

// create a post
router.post('/', multerConfig.array('selectedImages'), multerErrorHandler, async (req, res) => {
    // check if creator_id and images are provided in the body
    // if provided, continue to create post
    // otherwise, check which fields are missing and return 400 error
    const creatorPresent = req.body.creator_id != null;
    const imagePresent = req.files.length > 0;

    if (creatorPresent && imagePresent) {
        try {
            // check if creator exists
            const target = await User.findById(req.body.creator_id);

            if (!target) {
                return res.status(404).json({ message: 'Invalid user.' });
            }
    
            const post = new Post({
                creator_id: req.body.creator_id,
                content_links: []
            });

            // save post to make post_id available
            await post.save();

            // upload images and store the links in content_links of the new post
            const uploadSuccessful = await uploadImages(req.files, post.content_links, post.id);

            // if failed to upload images then delete the post from database and return error message
            if (!uploadSuccessful) {
                await Post.findByIdAndDelete(post.id);
                res.status(500).json({ message: 'Failed to upload images, please try again later.' });
            }

            await post.save();

            res.status(200).json({ message: 'Post created.' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    else {
        if (!creatorPresent && !imagePresent) {
            res.status(400).json({ message: 'Creator and at least one image is required.' });
        }
        else if (!creatorPresent) {
            res.status(400).json({ message: 'Creator is required.' });
        }
        else {
            res.status(400).json({ message: 'At least one image is required.' });
        }
    }
});

// modify a post
router.patch('/:postId', multerConfig.array('selectedImages'), multerErrorHandler, getPost, async (req, res) => {
    // check if images are provided in the body
    // if provided, continue to update post,
    // otherwise, return 400 error
    if (req.files.length > 0) {
        try {
            var newImageLinks = [];

            const uploadSuccessful = await uploadImages(req.files, newImageLinks, req.params.postId);

            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                res.status(500).json({ message: 'Failed to update post, please try again later.' });
            }

            // otherwise delete old images, update content_links and save the post
            deleteImages(res.post.content_links);

            res.post.content_links = newImageLinks;
            
            await res.post.save();

            res.status(200).json({ message: 'Post updated.' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    else {
        res.status(400).json({ message: 'At least one image is required.' });
    }
});

// delete a post
router.delete('/:postId', getPost, async (req, res) => {
    try {
        // delete associated images
        deleteImages(res.post.content_links);

        // delete associated comments
        for (let i = 0; i < res.post.comments.length; i++) {
            Comment.findByIdAndDelete(res.post.comments[i]);
        }

        await Post.findByIdAndDelete(req.params.postId);
        res.status(200).json({ message: 'Post removed.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// retrieve all comments for a post
router.get('/:postId/comments', getPost, async (req, res) => {
    try {
        // populate comment data to get creator's username and profile pic link
        const comments = await Post.findById(req.params.postId).select('comments').populate({
            path: 'comments',
            populate: {
                path: 'creator_id',
                select: 'username profile_pic_link'
            }
        });
        res.status(200).json(comments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// create a comment and update the post's comments field
router.post('/:postId/comments', express.json(), getPost, async (req, res) => {
    // check if creator_id and content are provided in the body
    // if provided, continue to create comment
    // otherwise, check which fields are missing and return 400 error
    if (req.body.creator_id && req.body.content) {
        // check if creator exists
        const target = await User.findById(req.body.creator_id);

        if (!target) {
            return res.status(404).json({ message: 'Invalid user.' });
        }

        const comment = new Comment({
            creator_id: req.body.creator_id,
            content: req.body.content
        });
    
        res.post.comments.push(comment._id);
    
        try {
            await comment.save();
            await res.post.save();

            const newComment = await Comment.findById(comment._id).populate({
                path: 'creator_id',
                select: 'username profile_pic_link'
            });

            res.status(200).json({ message: 'Comment created.', comment: newComment });
        }
        catch (error) {
            res.status(400).json({ message: error.message })
        }
    }
    else {
        if (!req.body.creator_id && !req.body.content) {
            res.status(400).json({ message: 'Both creator and comment content are required.' });
        }
        else if (!req.body.creator_id) {
            res.status(400).json({ message: 'Creator is required.' });
        }
        else {
            res.status(400).json({ message: 'Comment content is required.' });
        }
    }
});

// delete a comment and update the post's comments field
router.delete('/:postId/comments/:commentId', getPost, async (req, res) => {
    // check if the specified comment exists under the specified post
    const commentExists = res.post.comments.find(commentId => commentId == req.params.commentId);

    // if comment exists, continue to delete comment
    // otherwise, return 404 error
    if (commentExists) {
        const commentIndex = res.post.comments.indexOf(req.params.commentId);
        res.post.comments.splice(commentIndex, 1);

        try {
            await Comment.findByIdAndDelete(req.params.commentId);
            await res.post.save();
            res.status(200).json({ message: 'Comment deleted.' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    else {
        res.status(404).json({ message: 'Unable to find the specified comment.' });
    }
});

// like a post and update the post's likes field
router.post('/:postId/like', express.json(), getPost, async (req, res) => {
    // check if creator_id is provided in the body
    // if provided, continue to add the like
    // otherwise, return 400 error
    if (req.body.creator_id) {
        // check if creator exists
        const target = await User.findById(req.body.creator_id);

        if (!target) {
            return res.status(404).json({ message: 'Invalid user.' });
        }

        // check if the specified post is liked by the user
        const likeExists = res.post.likes.find(creator_id => creator_id == req.body.creator_id);
        
        // if the user has not liked the post, continue to add the like
        // otherwise, return 400 error
        if (!likeExists) {
            res.post.likes.push(req.body.creator_id);
    
            try {
                await res.post.save();
                res.status(201);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        }
        else {
            res.status(400).json({ message: 'You have already liked this post.' });
        }
    }
    else {
        res.status(400).json({ message: 'Creator is required.' });
    }
});

// remove like from a post and update the post's likes field
router.delete('/:postId/like/:creatorId', getPost, async (req, res) => {
    // check if creator exists
    const target = await User.findById(req.params.creatorId);

    if (!target) {
        return res.status(404).json({ message: 'Invalid user.' });
    }

    // check if the specified post is liked by the user
    const likeExists = res.post.likes.find(creator_id => creator_id == req.params.creatorId);
    
    // if the user has liked the post, continue to remove the like
    // otherwise, return 400 error
    if (likeExists) {
        const likeIndex = res.post.likes.indexOf(req.body.creator_id);
        res.post.likes.splice(likeIndex, 1);

        try {
            await res.post.save();
            res.status(204);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    else {
        res.status(400).json({ message: 'You have not liked this post.' });
    }
});

// find post by id
async function getPost(req, res, next) {
    let target;

    try {
        // populate post data to get creator's username and profile pic link
        target = await Post.findById(req.params.postId).populate({ path: 'creator_id', select: 'username profile_pic_link'});

        if (!target) {
            return res.status(404).json({ message: 'Unable to find the specified post.' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }

    res.post = target;
    next();
}

// upload image to firebase storage and update image links
// if uploading fails then delete all the uploaded images (ask user to retry later)
async function uploadImages(images, imageLinks, postId) {
    for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // create new file name with hash
        const newName = crypto.createHash('md5').update(image.originalname).update(Date.now().toString()).digest('hex');

        const metadata = {
            contentType: image.mimetype
        }

        const imageRef = ref(firebaseStorage, `posts/${postId}/${newName}`);
        await uploadBytes(imageRef, image.buffer, metadata)
            .then(async (result) => {
                await getDownloadURL(result.ref)
                    .then((downloadURL) => {
                        imageLinks.push(downloadURL.split('&token')[0]);
                    })
                    .catch(async (error) => {
                        console.log(error);
                        deleteImages(imageLinks);
                        return false;
                    });

            })
            .catch(async (error) => {
                console.log(error);
                deleteImages(imageLinks);
                return false;
            });
    }

    return true;
}

// delete images based on a list of URLs from firebase storage
function deleteImages(imageLinks) {
    const baseURL = process.env.FIREBASE_STORAGE_BASE_URL;
    
    for (let i = 0; i < imageLinks.length; i++) {
        let path = decodeURIComponent(imageLinks[i].replace(baseURL, '').split('?')[0]);
        const imageRef = ref(firebaseStorage, path);
        deleteObject(imageRef)
            .catch((error) => {
                console.log(error);
            });
    }
}

module.exports = router;