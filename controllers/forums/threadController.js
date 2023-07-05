// controller functions to handle GET requests for threads

const Forum = require('../../models/forum.js');
const Thread = require('../../models/thread.js');
const { checkThreadAttributes, checkThreadAttributesAll } = require('../../utils/forums/checkAttributes.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// get all threads
async function getAll(req, res) {
    try {
        const threads = await retrieveThreads(req.user._id, null, {
            creation_time: -1
        }, null);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);    
    }
}

// get threads associated with a forum
async function getForumThreads(req, res) {
    try {
        const threads = await retrieveThreads(req.user._id, {
            parent_id: req.params.forumID
        }, {
            creation_time: -1
        }, null);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);    
    }
}

// get one thread based on id
async function getOneThread(req, res) {
    try {
        const thread = checkThreadAttributes(res.thread, req.user._id);

        returnGoodReq(res, thread);
    } catch (error) {
        returnServerErrorReq(res);
    }
}

// get popular threads
async function getPopularThreads(req, res) {
    try {
        const threads = await retrieveThreads(req.user._id, null, {
            likes: -1
        }, 6);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);    
    }
}

// get recent threads
async function getRecentThreads(req, res) {
    try {
        // get forums created by the requesting user or subscribed by the requesting user
        const forums = await Forum.find({
            $or: [
                { creator_id: req.user._id },
                { subscribers: { $in: [req.user._id] } }
            ]
        },
        {
            '_id': 1
        }).lean();

        const forumIds = forums.map(forum => forum._id);

        const agg = [
            {
                // Finds threads in user subbed/created forums
                '$match': {
                    'parent_id': { '$in': forumIds }
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
                '$sort': {
                    'relevance': -1,
                    'creation_time': -1
                }
            }, {
                // Populates the parent_id field with the respective forum model fields packed into an object
                '$lookup': {
                    'from': 'forums',
                    'localField': 'parent_id',
                    'foreignField': '_id',
                    'as': 'forum'
                }
            }, {
                // Populates the creator_id field with the respective user model fields packed into an object
                '$lookup': {
                    'from': 'users',
                    'localField': 'creator_id',
                    'foreignField': '_id',
                    'as': 'user'
                }
            }, {
                '$addFields': {
                    // Store only selected fields from the user Object to the thread array
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
                    },
                    // Store only selected fields from the forum Object to the thread array
                    'parent_id._id': {
                        '$arrayElemAt': [
                            '$forum._id', 0
                        ]
                    },
                    'parent_id.forum_id': {
                        '$arrayElemAt': [
                            '$forum.forum_id', 0
                        ]
                    },
                    'parent_id.forum_pic_link': {
                        '$arrayElemAt': [
                            '$forum.forum_pic_link', 0
                        ]
                    },
                }
            }, {
                '$unset': [
                    'relevance', '__v', 'forum', 'user'
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
                    'disLiked': {
                        '$in': [
                            req.user._id, '$dislikes'
                        ]
                    }
                }
            }
        ];

        const threads = await Thread.aggregate(agg);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);    
    }
}

module.exports = {
    getAll,
    getForumThreads,
    getOneThread,
    getPopularThreads,
    getRecentThreads
}

// common function for getting threads by specified filter, sort criteria and limit and return after setting the various fields
async function retrieveThreads(userId, filter, sort, limit) {
    var threads = await Thread
        .find(filter)
        .sort(sort)
        .limit(limit)
        .getForum()
        .getCreator()
        .lean();

    return checkThreadAttributesAll(threads, userId);
}