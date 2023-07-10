const Comment = require('../../models/comment.js');

// common function to craft query based on given filter, sort and cache options
module.exports = function getCommentQuery(filter, sort, cache, cacheOptions) {
    const query = Comment
        .find(filter)
        .select('-parent_id -parent_model')
        .sort(sort ?? { creation_time: -1 })
        .getCreator()
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}