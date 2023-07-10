// to add new forum/udpate existing forum in cache

const redisClient = require('../redis.js');
const { getIndexKey, getIdIndex } = require('../../utils/cache/cacheIndexUtils.js');
const { FORUM_LONG_EXPIRATION_TIME } = require('./forumCache.js');

// to add new forum to cache and update forum:created entry if exists then asynchronously update database
async function cacheNewForum(forum, userDetails, key, createdKey) {
    const jsonForum = forum.toObject();

    jsonForum.creator_id = userDetails;

    const promises = [
        redisClient.json.set(key, '$', jsonForum),
        redisClient.expire(key, FORUM_LONG_EXPIRATION_TIME)
    ];

    // check if created key exists
    const createdKeyExists = await redisClient.exists(createdKey);

    // if key exists then update the key with the new forum's required details
    if (createdKeyExists) {
        const createdIdKey = getIndexKey(createdKey);
    
        const createdForum = {
            _id: forum._id,
            forum_name: forum.forum_name,
            forum_id: forum.forum_id,
            forum_pic_link: forum.forum_pic_link
        }

        promises.concat([
            redisClient.json.arrAppend(createdKey, '$', createdForum),
            redisClient.json.arrAppend(createdIdKey, '$', createdForum._id)
        ]);
    }

    await Promise.all(promises);

    forum.save().catch(error => console.log(error));
}

// to update forum data in cache and update database asynchronously
async function updateCachedForum(updatedValues, key, createdKey, forum) {
    // increase version key
    const promises = [redisClient.json.numIncrBy(key, '$.__v', 1)];

    let createdIndex = null;

    try {
        createdIndex = await getIdIndex(createdKey, forum._id);
    }
    catch (error) {
        // if error is not produced from inexistent path then throw error to handle in caller function
        if (error.message != "ERR Path '$' does not exist") {
            throw new Error();
        }
    }

    // add promise for each updated key/value
    for (const updatedKey in updatedValues) {
        if (updatedValues.hasOwnProperty(updatedKey)) {
            promises.push(redisClient.json.set(key, `$.${updatedKey}`, updatedValues[updatedKey]));

            // if forum:created entry exists:
            // update forum:created entry's key/value pairs if they already exist (prevent adding other unnecessary information of the forum)
            if (createdIndex != null) {
                promises.push(redisClient.json.set(createdKey, `$[${createdIndex}].${updatedKey}`, updatedValues[updatedKey], {
                    XX: true
                }));
            }
        }
    }
    
    // update forum
    await Promise.all(promises);

    // asynchronously save forum
    forum.save().catch(error => console.log(error));
}

module.exports = {
    cacheNewForum,
    updateCachedForum
}