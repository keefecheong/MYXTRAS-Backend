// controller functions to handle GET requests for posts

const Post = require('../../models/post.js');
const { checkPostAttributes, checkPostAttributesAll } = require('../../utils/posts/checkAttributes.js');

// retrieve all posts
const getAllPosts = async (req, res) => {
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
}

// retrieve user's own posts and posts by users followed
const getFollowingPosts = async (req, res) => {
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
}

// retrieve one post by requested id
const getOnePost = async (req, res) => {
    res.post = checkPostAttributes(res.post, req.user._id);

    res.status(200).json(res.post);
}

module.exports = {
    getAllPosts,
    getFollowingPosts,
    getOnePost
}