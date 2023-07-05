// controller functions to handle GET requests for posts

const Post = require('../../models/post.js');
const User = require('../../models/user.js');
const { checkPostAttributes, checkPostAttributesAll } = require('../../utils/posts/checkAttributes.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// retrieve all posts
async function getAllPosts(req, res) {
    try {
        const posts = await retrievePosts(null, null, req.user._id, req.user.saved_posts);

        returnGoodReq(res, posts);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// retrieve user's own posts and posts by users followed
async function getFollowingPosts(req, res){
    try {
        // get users that the requesting user follows
        const followingUsers = await User.find({
            followers: { $in: req.user._id }
        }, {
            '_id': 1
        }).lean();

        // add user ids into an array
        var userIds = followingUsers.map(user => user._id);
        userIds.push(req.user._id);

        const posts = await retrievePosts({
            creator_id: { $in: userIds }
        }, {
            creation_time: -1
        }, req.user._id, req.user.saved_posts);

        returnGoodReq(res, posts);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// retrieve one post by requested id
async function getOnePost(req, res) {
    const post = checkPostAttributes(res.post.toObject(), req.user._id, req.user.saved_posts);

    returnGoodReq(res, post);
}

// retrieve user's own posts
async function getOwnPosts(req, res) {
    try {
        const posts = await retrievePosts({
            creator_id: req.user._id
        }, null, req.user._id, req.user.saved_posts);

        returnGoodReq(res, posts);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// retrieve another user's own posts based on userid
async function getUserPost(req, res) {
    try {
        const posts = await retrievePosts({
            creator_id: req.params.userId
        }, null, req.user._id, req.user.saved_posts);

        returnGoodReq(res, posts);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// get popular posts for 'explore'
// based on like/comment count and does not include requesting user's posts
async function getPopularPosts(req, res) {
    try {
        // aggregation pipeline
        // first filter to only posts not created by the current user
        // calculate 'relevance' based on the number of matches between the post's tags and the user's interests
        // calculate 'activity' based on sum of likes and comments
        // sorts posts based on descending relevance and activity count
        // populate and format creator's username and profile_pic_link fields
        // set isOwner, liked, and saved values
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
                    },
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
            }, {
                '$addFields': {
                    // set fields
                    'isOwner': {
                        '$eq': [
                            '$creator_id._id', req.user._id
                        ]
                    },
                    'liked': {
                        '$in': [
                            req.user._id, '$likes'
                        ]
                    },
                    'saved': {
                        '$in': [
                            '$_id', req.user.saved_posts
                        ]
                    }
                }
            }
        ];

        var posts = await Post.aggregate(agg);

        returnGoodReq(res, posts);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// get posts saved by the user
async function getSavedPosts(req, res) {
    try {
        const posts = await retrievePosts({
            _id: { $in: req.user.saved_posts }
        }, null, req.user._id, req.user.saved_posts);

        returnGoodReq(res, posts);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getAllPosts,
    getFollowingPosts,
    getOnePost,
    getOwnPosts,
    getUserPost,
    getPopularPosts,
    getSavedPosts
}

// common function to get posts by specified filter and sort criteria and return after setting various fields
async function retrievePosts(filter, sort, userId, savedPosts) {
    const posts = await Post
        .find(filter)
        .sort(sort)
        .getCreator()
        .lean();

    return checkPostAttributesAll(posts, userId, savedPosts);
}