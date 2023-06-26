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
            })
            .lean();

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
            })
            .lean();

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

// retrieve user's own posts
const getOwnPosts = async (req, res) => {
    try {
        // populate post data to get creator's username and profile pic link
        var posts = await Post
            .find({ creator_id: req.user._id })
            .populate({ 
                path: 'creator_id',
                select: 'username profile_pic_link'
            })
            .lean();

        posts = checkPostAttributesAll(posts, req.user._id);
        
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get popular posts for 'explore'
// based on like/comment count and does not include requesting user's posts
const getPopularPosts = async (req, res) => {
    try {
        // aggregation pipeline
        // first filter to only posts not created by the current user
        // calculate 'relevance' based on the number of matches between the post's tags and the user's interests
        // calculate 'activity' based on sum of likes and comments
        // sorts posts based on descending relevance and activity count
        // populate and format creator's username and profile_pic_link fields
        // removes unneeded fields before returning result
        const agg = [
            {
              '$match': {
                'creator_id': {
                  '$ne': req.user._id
                }
              }
            }, {
                '$addFields': {
                    'relevance': {
                        '$size': {
                            '$setIntersection': [
                                '$tags', req.user.interests
                            ]
                        }
                    }
                }
            }, {
                '$addFields': {
                    'activity': {
                        '$add': [
                            {
                                '$size': '$likes'
                            }, '$comment_count'
                        ]
                    }
                }
            }, {
                '$sort': {
                    'relevance': -1, 
                    'activity': -1
                }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': 'creator_id', 
                'foreignField': '_id', 
                'as': 'user'
              }
            }, {
              '$addFields': {
                'creator_id._id': {
                  '$arrayElemAt': [
                    '$user._id', 0
                  ]
                }, 
                'creator_id.username': {
                  '$arrayElemAt': [
                    '$user.username', 0
                  ]
                }, 
                'creator_id.profile_pic_link': {
                  '$arrayElemAt': [
                    '$user.profile_pic_link', 0
                  ]
                }
              }
            }, {
              '$unset': [
                'activity', 'relevance', '__v', 'user'
              ]
            }
          ];

          var posts = await Post.aggregate(agg);
          
          posts = checkPostAttributesAll(posts, req.user._id);
          res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getAllPosts,
    getFollowingPosts,
    getOnePost,
    getOwnPosts,
    getPopularPosts
}