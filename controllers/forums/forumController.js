// controller functions for GET requests for forums

const Forum = require('../../models/forum.js');

// verify if forum_id is already in use
const verifyForumID = async (req, res) => {
    const existingForum = await Forum.findOne({ forum_id: req.body.forum_id });

    if (existingForum) {
        return res.status(400).json({ error: 'ForumID already exists' });
    }
    else {
        return res.status(200).end()
    }
}

// get forum by _id
const getOneForum = async (req, res) => {
    // copy forum from middleware to object to modify
    const workingForum = res.forum.toObject();

    var isSubscribed = false;
    var isCreator = false;
    
    // set fields
    if (req.user._id.equals(res.forum.creator_id._id)){
        isCreator = true;
    }
    if (res.forum.subscribers.includes(req.user._id)) {
        isSubscribed = true;
    }

    workingForum.isCreator = isCreator;
    workingForum.isSubscribed = isSubscribed;
    res.status(200).json(workingForum);
}

// get created forums
const getCreated = async (req, res) => {
    try {
        const forums =  await Forum
            .find({ creator_id: req.user.id }, { forum_id: 1, forum_name: 1, forum_pic_link: 1 })
            .select('forum_id forum_name forum_pic_link')
            .lean();

        res.status(200).json(forums);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// get subscribed forums
const getSubscribed = async (req, res) => {
    const subbed_forums = await Forum
        .find({ subscribers: { $in: [req.user._id] } })
        .select('forum_name forum_id forum_pic_link')
        .lean();

    res.status(200).json(subbed_forums);
}

// get 6 recommended forums based on number of subscribers
const getRecommended = async (req, res) => {
    const recommendedForums = await Forum.aggregate([
        {
          $addFields: {
            numOfSubs: { $size: "$subscribers" }
          }
        },
        {
          $sort: {
            numOfSubs: -1
          }
        },
        {
          $limit: 6
        },
        {
          $project: {
            forum_name: 1,
            forum_id: 1,
            forum_pic_link: 1,
            numOfSubs: 1
          }
        }
      ]);

    res.status(200).json(recommendedForums);
}

// get categorized forums
const getCategorized = async (req, res) => {
    const agg = [
        {
            $unwind: "$tags" // Unwind the tags array
        }, {
          $addFields: {
            subscribers_count: { $size: "$subscribers" }
          }
        }, {
          $sort: { "subscribers_count": -1 } // sort by subscribers_count in descending order
        }, {
          $group: {
              _id: "$tags", // Group by each unique tag
              forums: { $push: "$$ROOT" }, // Collect the forums with the same tag into an array
          },
        }, {
          $project: {
            _id: 1,
            forums: { $slice: ["$forums", 6] }, // Limit the forums array to 6 elements
          },
        }, {
          $sort: { "_id": 1 } // sort interests by alphabet
        }, {
          '$unset': [
            'forums.subscribers', 'forums.subscribers_count', 'forums.forum_desc', 'forums.forum_id', 'forums.creation_time', 'forums.creator_id'
          ] 
        }
    ]
    const sortedForums = await Forum.aggregate(agg);
    res.status(200).json(sortedForums);
}

module.exports = {
    verifyForumID,
    getOneForum,
    getCreated,
    getSubscribed,
    getRecommended,
    getCategorized
}