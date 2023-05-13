const express = require('express');
const router = express.Router();
const Post = require('../models/post.js');
const Comment = require('../models/comment.js');

// retrieve all posts
router.get('/', async (req, res) => {
    try {
        var posts = await Post.find();
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// retrieve a post by id
router.get('/:postId', getPost, async (req, res) => {
    res.status(200).json(res.post);
});

// create a post
router.post('/', async (req, res) => {
    // check if creator_id and content_links are provided in the body
    // if provided, continue to create post
    // otherwise, check which fields are missing and return 400 error
    if (req.body.creator_id && req.body.content_links) {
        const post = new Post({
            creator_id: req.body.creator_id,
            content_links: req.body.content_links
        });
    
        try {
            await post.save();
            res.status(200).json({ message: 'Post created.' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    else {
        if (!req.body.creator_id && !req.body.content_links) {
            res.status(400).json({ message: 'Creator and at least one image is required.' });
        }
        else if (!req.body.creator_id) {
            res.status(400).json({ message: 'Creator is required.' });
        }
        else {
            res.status(400).json({ message: 'At least one image is required.' });
        }
    }
});

// modify a post
router.patch('/:postId', getPost, async (req, res) => {
    // check if content_links is provided in the body
    // if provided, continue to update post,
    // otherwise, return 400 error
    if (req.body.content_links) {
        res.post.content_links = req.body.content_links;

        try {
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
        const comments = await Post.findById(req.params.postId).select('comments').populate('comments');
        res.status(200).json(comments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// create a comment and update the post's comments field
router.post('/:postId/comments', getPost, async (req, res) => {
    // check if creator_id and content are provided in the body
    // if provided, continue to create comment
    // otherwise, check which fields are missing and return 400 error
    if (req.body.creator_id && req.body.content) {
        const comment = new Comment({
            creator_id: req.body.creator_id,
            content: req.body.content
        });
    
        res.post.comments.push(comment._id);
    
        try {
            await comment.save();
            await res.post.save();
            res.status(200).json({ message: 'Comment created.' });
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
router.post('/:postId/like', getPost, async (req, res) => {
    // check if creator_id is provided in the body
    // if provided, continue to add the like
    // otherwise, return 400 error
    if (req.body.creator_id) {
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
router.delete('/:postId/like', getPost, async (req, res) => {
    // check if creator_id is provided in the body
    // if provided, continue to remove the like
    // otherwise, return 400 error
    if (req.body.creator_id) {
        // check if the specified post is liked by the user
        const likeExists = res.post.likes.find(creator_id => creator_id == req.body.creator_id);
        
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
    }
    else {
        res.status(400).json({ message: 'Creator is required.' });
    }
});

// find post by id
async function getPost(req, res, next) {
    let target;

    try {
        target = await Post.findById(req.params.postId);

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

module.exports = router;