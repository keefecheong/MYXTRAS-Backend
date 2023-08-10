// to test if deleting a forum would delete its associated threads and comments from database and cache

const { PARENT_MODEL_THREAD } = require('../../comment/models/comment.js');

const exitAfterTest = require('../../utils/test/exitAfterTest.js');
const generateContextFromTests = require('../../utils/test/generateContextFromTests.js');
const generateTestTitle = require('../../utils/test/generateTestTitle.js');
const generatePlaceholderBlock = require('../../utils/test/generatePlaceholderBlock.js');
const {
    VERIFY_POPULATED_DATA_USERS,
    VERIFY_POPULATED_DATA_FORUMS,
    VERIFY_POPULATED_DATA_THREADS,
    VERIFY_POPULATED_DATA_THREAD_COMMENTS,
    verifyPopulatedData
} = require('../../utils/test/verifyPopulatedData.js');

const addUsersToDB = require('../../user/test/populateUsers.js');
const addForumsToDB = require('./populateForums.js');

const { deleteForum, verifyDBDeleteForum, verifyCacheDeleteForum } = require('./verifyDeleteForum.js');
const { verifyDBDeleteThread, verifyCacheDeleteThreadParent } = require('../../thread/test/verifyDeleteThread.js');
const { verifyDBDeleteCommentParent, verifyCacheDeleteCommentParent } = require('../../comment/test/verifyDeleteParent.js');

const userCount = 1;
const forumCount = 1;
const threadCount = 5;
const commentCount = 5;
let threadIds, deletedForumId, deletedForumCreatorId;

let mainSuite = describe('DELETE /api/forums/:forumId', () => {
    before(async () => {
        // populate users, forums, thread, and comments
        const userIds = (await addUsersToDB(userCount)).map(user => user._id);

        const addForumsResult = await addForumsToDB(forumCount, userIds, threadCount, commentCount).catch(error => console.log(error));

        const forums = addForumsResult.forumData;
        const forumIds = forums.map(forum => forum._id);

        threadIds = addForumsResult.threadData.map(thread => thread._id);
        const threadCommentIds = addForumsResult.threadComments.map(comment => comment._id);

        // verify populated data
        mainSuite.suites.push(verifyPopulatedData([
            VERIFY_POPULATED_DATA_USERS,
            VERIFY_POPULATED_DATA_FORUMS,
            VERIFY_POPULATED_DATA_THREADS,
            VERIFY_POPULATED_DATA_THREAD_COMMENTS
        ], {
            userIds,
            forumIds,
            threadIds,
            threadCommentIds
        }));

        // generate and dynamically add test to verify data before and after deletion of forum
        deletedForumId = forums[0]._id;
        deletedForumCreatorId = forums[0].creator_id;

        mainSuite.suites.push(generateDeleteForumTestContext(false));
        mainSuite.suites.push(generateDeleteForumTestContext(true));
    });

    // clean up and exit
    after(exitAfterTest);
    
    generatePlaceholderBlock();
});

// generate context for forum deletion tests
function generateDeleteForumTestContext(deleted) {
    return generateContextFromTests(deleted, 'deleting', generateDeleteForumTests(deleted));
}

// generate tests for forum deletion
function generateDeleteForumTests(deleted) {
    // test cases
    // before deleting:
    //      forum should be present in database and cache
    //      threads should be present in database and cache
    //      comments should be present in database and cache
    // after deleting:
    //      forum should not be present in database nor cache
    //      threads should not be present in database nor cache
    //      comments should not be present in database nor cache
    const tests = [
        // check if forum exists in database and cache
        {
            title: generateTestTitle(deleted, 'forum', true),
            callback: verifyDBDeleteForum,
            params: [deletedForumId, deleted]
        },
        {
            title: generateTestTitle(deleted, 'forum', false),
            callback: verifyCacheDeleteForum,
            params: [deletedForumId, deleted]
        },
        // check if associated threads exist in database and cache
        {
            title: generateTestTitle(deleted, 'threads', true),
            callback: verifyDBDeleteThread,
            params: [threadIds, deleted]
        },
        {
            title: generateTestTitle(deleted, 'threads', false),
            callback: verifyCacheDeleteThreadParent,
            params: [deletedForumId, deleted]
        },
        // check if associated threads' comments exist in database and cache
        {
            title: generateTestTitle(deleted, 'comments', true),
            callback: verifyDBDeleteCommentParent,
            params: [threadIds, deleted]
        },
        {
            title: generateTestTitle(deleted, 'comments', false),
            callback: verifyCacheDeleteCommentParent,
            params: [threadIds, PARENT_MODEL_THREAD, deleted]
        }
    ];

    // if to delete then add test to send delete request
    if (deleted) {
        tests.unshift({
            title: 'should return 200',
            callback: deleteForum,
            params: [deletedForumId, deletedForumCreatorId]
        });
    }

    return tests;
}