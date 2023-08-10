// return consolidated tests to verify data is populated correctly

const { PARENT_MODEL_POST, PARENT_MODEL_THREAD } = require('../../comment/models/comment.js');

const { verifyDBPopulatedUsers, verifyCachePopulatedUsers } = require('../../user/test/verifyPopulateUsers.js');
const { verifyDBPopulatedPosts, verifyCachePopulatedPosts } = require('../../post/test/verifyPopulatePosts.js');
const { verifyDBPopulatedForums, verifyCachePopulatedForums } = require('../../forum/test/verifyPopulateForums.js');
const { verifyDBPopulatedThreads, verifyCachePopulatedThreads } = require('../../thread/test/verifyPopulateThreads.js');
const { verifyDBPopulatedComments, verifyCachePopulatedComments } = require('../../comment/test/verifyPopulateComments.js');
const { verifyDBPopulatedChats } = require('../../chat/test/verifyPopulateChats.js');
const { verifyDBPopulatedMessages } = require('../../chat/test/verifyPopulateMessages.js');

const generateContextFromTests = require('./generateContextFromTests.js');

const VERIFY_POPULATED_DATA_USERS = 'users';
const VERIFY_POPULATED_DATA_POSTS = 'posts';
const VERIFY_POPULATED_DATA_POST_COMMENTS = 'postComments';
const VERIFY_POPULATED_DATA_FORUMS = 'forums';
const VERIFY_POPULATED_DATA_THREADS = 'threads';
const VERIFY_POPULATED_DATA_THREAD_COMMENTS = 'threadComments';
const VERIFY_POPULATED_DATA_CHATS = 'chats';
const VERIFY_POPULATED_DATA_MESSAGES = 'messages';

// create suite based on objects to verify
function verifyPopulatedData(objects, data) {
    const tests = [];

    for (const object of objects) {
        switch (object) {
            case VERIFY_POPULATED_DATA_USERS:
                tests.push(verifyDBPopulatedUsers(data.userIds));
                tests.push(verifyCachePopulatedUsers(data.userIds));

                break;

            case VERIFY_POPULATED_DATA_POSTS:
                tests.push(verifyDBPopulatedPosts(data.postIds));
                tests.push(verifyCachePopulatedPosts(data.userIds));

                break;

            case VERIFY_POPULATED_DATA_FORUMS:
                tests.push(verifyDBPopulatedForums(data.forumIds));
                tests.push(verifyCachePopulatedForums(data.forumIds));

                break;

            case VERIFY_POPULATED_DATA_THREADS:
                tests.push(verifyDBPopulatedThreads(data.threadIds));
                tests.push(verifyCachePopulatedThreads(data.forumIds));

                break;

            case VERIFY_POPULATED_DATA_POST_COMMENTS:
                tests.push(verifyDBPopulatedComments(data.postCommentIds));
                tests.push(verifyCachePopulatedComments(data.postIds, PARENT_MODEL_POST));

                break;

            case VERIFY_POPULATED_DATA_THREAD_COMMENTS:
                tests.push(verifyDBPopulatedComments(data.threadCommentIds));
                tests.push(verifyCachePopulatedComments(data.threadIds, PARENT_MODEL_THREAD));

                break;

            case VERIFY_POPULATED_DATA_CHATS:
                tests.push(verifyDBPopulatedChats(data.chatIds));

                break;

            case VERIFY_POPULATED_DATA_MESSAGES:
                tests.push(verifyDBPopulatedMessages(data.messageIds));

                break;

            default:
                break;                                                                                    
        }
    }

    return generateContextFromTests(null, null, tests, 'verifying populated data');
}

module.exports = {
    VERIFY_POPULATED_DATA_USERS,
    VERIFY_POPULATED_DATA_POSTS,
    VERIFY_POPULATED_DATA_FORUMS,
    VERIFY_POPULATED_DATA_THREADS,
    VERIFY_POPULATED_DATA_POST_COMMENTS,
    VERIFY_POPULATED_DATA_THREAD_COMMENTS,
    VERIFY_POPULATED_DATA_CHATS,
    VERIFY_POPULATED_DATA_MESSAGES,
    verifyPopulatedData
}