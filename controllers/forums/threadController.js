// controller functions to handle GET requests for threads

const Forum = require('../../models/forum.js');
const Thread = require('../../models/thread.js');
const { checkThreadAttributes, checkThreadAttributesAll } = require('../../utils/forums/checkAttributes.js');

// get all threads
const getAll = async (req, res) => {
    try {
        var threads = await Thread.find()
        .populate({
            path: 'parent_id',
            select: 'forum_name forum_id forum_pic_link'
        })
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean();

        threads = checkThreadAttributesAll(threads, req.user._id);

        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get threads associated with a forum
const getForumThreads = async (req, res) => {
    try {
        var threads =  await Thread.find({parent_id: req.params.forumID})
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean();

        threads = checkThreadAttributesAll(threads, req.user._id);

        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get one thread based on id
const getOneThread = async (req, res) => {
    try {
        const thread = checkThreadAttributes(res.thread, req.user._id);

        res.status(200).json(thread);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// get popular threads
const getPopularThreads = async (req, res) => {
    var threads = await Thread.find()
    .populate({ 
        path: 'creator_id',
        select: 'username profile_pic_link'
    })
    .sort({ likes: -1 })
    .limit(6)
    .lean();

    threads = checkThreadAttributesAll(threads, req.user._id);

    res.status(200).json(threads);
}

// get recent threads
const getRecentThreads = async (req, res) => {
    const forums = await Forum.find({
        $or: [
          { creator_id: req.user.id },
          { subscribers: { $in: [req.user._id] } }
        ]
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
                'creation_date': -1
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
            // Store only selected fields from the user Object to the thread array
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
            // Store only selected fields from the forum Object to the thread array
            '$addFields': {
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
              }
            }
        }, {
            '$unset': [
               'relevance', '__v'
            ]
          }
      ];
    
    const threads = await Thread.aggregate(agg);
    return res.status(200).json(threads);
}

module.exports = {
    getAll,
    getForumThreads,
    getOneThread,
    getPopularThreads,
    getRecentThreads
}