const Forum = require('../../models/forum.js');

// common function to craft query based on given filter and cache options
module.exports = function getForumQuery(filter, cache, cacheOptions) {
    const query = Forum
        .find(filter)
        .select('forum_name forum_id forum_pic_link')
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}