// to populate forums

const Forum = require('../models/forum.js');
const addThreadsToDB = require('../../thread/test/populateThreads.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const generateRandomReactions = require('../../utils/test/generateRandomReactions.js');

const compareId = require('../../utils/general/compareId.js');

// to add forums, threads, and comments to database then populate cache
module.exports = async function addForumsToDB(count, creatorIds, threadCount, commentCount) {
    // create forums for each user
    const forums = creatorIds.flatMap(creatorId => generateForumsPerCreator(creatorId, count));

    // add forums, threads, and comments to database
    await Forum.insertMany(forums);

    const forumIds = forums.map(forum => forum._id);
    const { threadData, threadComments } = await addThreadsToDB(threadCount, creatorIds, forumIds, commentCount);

    const forumData = forums.map(forum => {
        return {
            _id: forum._id,
            creator_id: forum.creator_id
        }
    });

    // populate forums and threads in cache
    await populateForumCache(forumIds);

    return { forumData, threadData, threadComments };
}

// generate <count> forums by a user
function generateForumsPerCreator(creatorId, count, userIds) {
    const forums = [];

    for (let i = 0; i < count; i++) {
        forums.push(new Forum({
            creator_id: creatorId,
            forum_name: `forum_name_${i}`,
            forum_id: `forum_id_${1}`,
            forum_pic_link: 'http://fakelink/forum_pic.png',
            banner_link: 'http://fakelink/banner.png',
            subscribers: generateRandomReactions(userIds.filter(userId => !compareId(userId, creatorId)))
        }));
    }

    return forums;
}

// to populate cache with forum and threads
async function populateForumCache(forumIds) {
    await Promise.all(forumIds.map(forumId => [sendMockRequest(`/api/forums/${forumId}`), sendMockRequest(`/api/threads/forum/${forumId}`)]).flat());
}