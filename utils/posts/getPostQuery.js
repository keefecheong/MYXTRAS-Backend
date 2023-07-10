const Post = require('../../models/post.js');

// common function to craft Post query
module.exports = function getPostQuery(filter, sort, cache, cacheOptions) {
    const query = Post
        .find(filter)
        // set default sorting to descending creation_time
        .sort(sort ?? { creation_time: -1 })
        .getCreator()
        .lean();

    // set cache if true
    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}