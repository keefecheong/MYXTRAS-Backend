const express = require('express');
const router = express.Router();
const Post = require('../models/post.js');
const Comment = require('../models/comment.js');
const User = require('../models/user.js');
const multer = require('multer');
const crypto = require('crypto');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const jwt = require('jsonwebtoken');

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

// validate user for all routes
router.use(validateUser);

// retrieve all posts
router.get('/', async (req, res) => {
    try {
        // populate post data to get creator's username and profile pic link
        var posts = await Post
            .find()
            .populate({ 
                path: 'creator_id',
                select: 'username profile_pic_link'
            });

        posts = checkPostAttributesAll(posts, req.user._id);

        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// retrieve user's own posts and posts by users followed
router.get('/following', async (req, res) => {
    try {
        // list of user ids to get posts from
        let targetUsers = Array.from(req.user.following).push(req.user._id);

        // populate post data to get creator's username and profile pic link
        var posts = await Post
            .where('creator_id')
            .in(targetUsers)
            .populate({ 
                path: 'creator_id',
                select: 'username profile_pic_link'
            });

        posts = checkPostAttributesAll(posts, req.user._id);
        
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// retrieve a post by id
router.get('/:postId', getPost, async (req, res) => {
    res.post = checkPostAttributes(res.post, req.user._id);

    res.status(200).json(res.post);
});

// create a post
router.post('/', multerConfig.array('selectedImages'), multerErrorHandler, async (req, res) => {
    // check if images are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        return res.status(400).json({ message: 'At least one image is required.' });
    }

    try {
        const post = new Post({
            creator_id: req.user._id,
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
});

// modify a post
router.patch('/:postId', multerConfig.array('selectedImages'), multerErrorHandler, getPost, async (req, res) => {
    // check if images are provided in the body
    // if provided, continue to update post,
    // otherwise, return 400 error
    if (req.files.length <= 0) {
        return res.status(400).json({ message: 'At least one image is required.' });   
    }

    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (req.user._id.toString() != res.post.creator_id._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

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
});

// delete a post
router.delete('/:postId', getPost, async (req, res) => {
    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (req.user._id.toString() != res.post.creator_id._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        // delete associated images
        deleteImages(res.post.content_links);

        // delete associated comments
        for (let i = 0; i < res.post.comments.length; i++) {
            Comment.findByIdAndDelete(res.post.comments[i]);
        }

        // delete post
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
        const postComments = await Post
            .findById(req.params.postId)
            .select('comments')
            .populate({
                path: 'comments',
                populate: {
                    path: 'creator_id',
                    select: 'username profile_pic_link'
                }
            });

        const comments = checkCommentAttributesAll(postComments.comments, req.user._id);

        res.status(200).json(comments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// create a comment and update the post's comments field
router.post('/:postId/comments', express.json(), getPost, async (req, res) => {
    // check if content is provided in the body
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        res.status(400).json({ message: 'Comment content is required.' });
    }

    const comment = new Comment({
        creator_id: req.user._id,
        content: req.body.content
    });

    // update post's comments list
    res.post.comments.push(comment._id);

    try {
        // update database
        await comment.save();
        await res.post.save();

        // return the new comment data to update dom
        var newComment = await Comment
            .findById(comment._id)
            .populate({
                path: 'creator_id',
                select: 'username profile_pic_link'
            });

        newComment = checkCommentAttributes(newComment, req.user._id);

        res.status(200).json({ message: 'Comment created.', comment: newComment });
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
});

// delete a comment and update the post's comments field
router.delete('/:postId/comments/:commentId', getPost, async (req, res) => {
    // check if comment exists
    const targetComment = await Comment.findById(req.params.commentId);

    // check if the comment is posted by the requesting user
    // if creator is not the requesting user return 401 error
    if (targetComment.creator_id._id.toString() != req.user._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    // check if the specified comment exists under the specified post
    const commentUnderPost = res.post.comments.find(commentId => commentId == req.params.commentId);

    // if comment exists and is under the specified post, continue to delete comment
    // otherwise, return 404 error
    if (!targetComment || !commentUnderPost) {
        return res.status(404).json({ message: 'Unable to find the specified comment.' })
    }

    // remove comment id from post's comments list
    const commentIndex = res.post.comments.indexOf(req.params.commentId);
    res.post.comments.splice(commentIndex, 1);

    try {
        // update database
        await Comment.findByIdAndDelete(req.params.commentId);
        await res.post.save();

        res.status(200).json({ message: 'Comment deleted.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// like a post and update the post's likes field
router.post('/:postId/like', getPost, async (req, res) => {
    // check if the specified post is liked by the user
    const likeExists = res.post.likes.find(creator_id => creator_id == req.user._id);
    
    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return res.status(400).json({ message: 'You have already liked this post.' });
    }

    // update post's likes list
    res.post.likes.push(req.user._id);

    try {
        await res.post.save();
        res.status(201).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// remove like from a post and update the post's likes field
router.delete('/:postId/like', getPost, async (req, res) => {
    // check if the specified post is liked by the user
    const likeIndex = res.post.likes.indexOf(req.user._id);
    
    // if the user has liked the post, continue to remove the like
    // otherwise, return 400 error
    if (likeIndex == -1) {
        return res.status(400).json({ message: 'You have not liked this post.' });
    }

    // remove user id from post's likes list
    res.post.likes.splice(likeIndex, 1);

    try {
        await res.post.save();
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
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

// make sure jwt is valid and user is authenticated
async function validateUser(req, res, next) {
    try {
        // Get the JWT token from the cookie
        const token = req.cookies.authapi;

        // return 401 error if there is no authapi cookie
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized.' });
        }
        
        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // get user based on id in jwt token
        const userId = decodedToken.id;
        const user = await User.findById(userId);

        // return 404 error if user not found
        if (!user) {
          return res.status(404).json({ message: 'Invalid user.' });
        }

        // Attach the user object to the request for further processing
        req.user = user;
        
        next();
    }
    // Handle token verification or database errors
    catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

// adds fields to the post object:
// 1. check if the requesting user is the owner of the post
// 2. check if the requesting user has liked the post
// for an array of posts
function checkPostAttributesAll(posts, userId) {
    let result = [];

    for (let i = 0; i < posts.length; i ++) {
        result.push(checkPostAttributes(posts[i], userId));
    }

    return result;
}

// for one post
function checkPostAttributes(post, userId) {
    post = post.toObject();

    post.isOwner = post.creator_id._id.toString() == userId.toString();
    post.liked = post.likes.findIndex((creator_id) => creator_id.toString() == userId.toString()) != -1;

    return post;
}

// add fields to the comment object:
// check if the requesting user is the owner of the comment
// for an array of comments
function checkCommentAttributesAll(comments, userId) {
    let result = [];

    for (let i = 0; i < comments.length; i++) {
        result.push(checkCommentAttributes(comments[i], userId));
    }

    return result;
}

// for one comment
function checkCommentAttributes(comment, userId) {
    comment = comment.toObject();

    comment.isOwner = comment.creator_id._id.toString() == userId.toString();

    return comment;
}

module.exports = router;