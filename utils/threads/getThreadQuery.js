const Thread = require('../../models/thread.js');

// common function to craft query based on given filter, sort, and cache options
function getThreadQuery(filter, sort, cache, cacheOptions) {
    const query = Thread
        .find(filter)
        .sort(sort ?? { creation_time: -1 })
        .getForum()
        .getCreator()
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}

// to get aggregation function for popular/relevant threads based on the given interest list and thread limit
function getAggFunction(interests, limit) {
    return [
        {
            '$addFields': {
                'relevance': {
                    '$size': {
                        '$setIntersection': [
                            '$tags', interests
                        ]
                    }
                },
                'activity': {
                    '$add': [
                        {
                            '$size': '$likes'
                        },
                        '$comment_count'
                    ]
                }
            }
        },
        {
            '$sort': {
                'relevance': -1,
                'activity': -1
            }
        },
        {
            '$limit': limit
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'creator_id',
                'foreignField': '_id',
                'as': 'user'
            }
        },
        {
            '$lookup': {
                'from': 'forums',
                'localField': 'parent_id',
                'foreignField': '_id',
                'as': 'forum'
            }
        },
        {
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
        },
        {
            '$unset': [
                'activity', 'relevance', '__v', 'forum', 'user'
            ]
        }
    ]
}

module.exports = {
    getThreadQuery,
    getAggFunction
}