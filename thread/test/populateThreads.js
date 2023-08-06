// to populate threads

const Thread = require('../models/thread.js');
const addCommentsToDB = require('../../comment/test/populateComments.js');
const { PARENT_MODEL_THREAD } = require('../../comment/models/comment.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const generateRandomReactions = require('../../utils/test/generateRandomReactions.js');
const compareId = require('../../utils/general/compareId.js');

// to add threads and forums to database then populate cache
module.exports = async function addThreadsToDB(count, creatorIds, forumIds, commentCount) {
    // create threads for each user under each forum
    const threads = forumIds.flatMap(forumId => 
        creatorIds.flatMap(creatorId => 
            generateThreadsPerCreatorAndForum(count, forumId, creatorId, creatorIds)
        )
    );

    // add threads and comments
    await Thread.insertMany(threads);

    const threadComments = await addCommentsToDB(commentCount, threads.map(thread => thread._id), PARENT_MODEL_THREAD, creatorIds);

    const threadData = threads.map(thread => {
        return {
            _id: thread._id,
            parent_id: thread.parent_id,
            creator_id: thread.creator_id
        }
    });

    // populate comment cache
    await populateThreadCommentsCache(threadData);

    return { threadData, threadComments };
}

// generate <count> threads per user per forum
function generateThreadsPerCreatorAndForum(count, parentId, creatorId, userIds) {
    const threads = [];

    for (let i = 0; i < count; i++) {
        // generate likes and dislikes
        const likes = generateRandomReactions(userIds);
        // dislikes cannot have repeated user ids in likes
        const dislikes = generateRandomReactions(userIds.filter(userId => !likes.some(likedId => compareId(likedId, userId))));

        threads.push(new Thread({
            parent_id: parentId,
            creator_id: creatorId,
            title: `thread_${i}`,
            content: `thread content_${i}`,
            likes,
            dislikes            
        }));
    }

    return threads;
}

// to populate cache with thread comments
async function populateThreadCommentsCache(threads) {
    await Promise.all(threads.map(thread => sendMockRequest(`/api/threads/forum/${thread.parent_id}/thread/${thread._id}`)));
}