// to test if terminating a user will perform as intended

const { PARENT_MODEL_POST, PARENT_MODEL_THREAD } = require('../../comment/models/comment.js');

const exitAfterTest = require('../../utils/test/exitAfterTest.js');
const generateContextFromTests = require('../../utils/test/generateContextFromTests.js');
const generateTestTitle = require('../../utils/test/generateTestTitle.js');
const generatePlaceholderBlock = require('../../utils/test/generatePlaceholderBlock.js');
const {
    VERIFY_POPULATED_DATA_USERS,
    VERIFY_POPULATED_DATA_POSTS,
    VERIFY_POPULATED_DATA_POST_COMMENTS,
    VERIFY_POPULATED_DATA_FORUMS,
    VERIFY_POPULATED_DATA_THREADS,
    VERIFY_POPULATED_DATA_THREAD_COMMENTS,
    VERIFY_POPULATED_DATA_CHATS,
    VERIFY_POPULATED_DATA_MESSAGES,
    verifyPopulatedData
} = require('../../utils/test/verifyPopulatedData.js');

const addUsersToDB = require('../../user/test/populateUsers.js');
const addPostsToDB = require('../../post/test/populatePosts.js');
const addForumsToDB = require('../../forum/test/populateForums.js');
const addChatsToDB = require('../../chat/test/populateChats.js');

const { terminateUser, verifyDBUserTerminated, verifyCacheUserTerminated } = require('./verifyTerminateUser.js');

const { verifyDBHasFollowers, verifyCacheHasFollowers, verifyDBIsFollowingAny, verifyCacheIsFollowingAny } = require('../../user/test/verifyUserFollowers.js');
const { verifyDBUserIsBlockingAny, verifyCacheUserIsBlockingAny, verifyDBUserIsBlockedByAny, verifyCacheUserIsBlockedByAny } = require('../../user/test/verifyBlockUser.js');

const { verifyDBUserHasCreatedPosts, verifyCacheUserHasCreatedPosts } = require('../../post/test/verifyPostByUser.js');
const { verifyDBUserReactedToOtherPosts, verifyCacheUserReactedToOtherPosts } = require('../../post/test/verifyPostReaction.js');

const { verifyDBUserHasCreatedForums, verifyCacheUserHasCreatedForums } = require('../../forum/test/verifyForumByUser.js');
const { verifyDBUserSubscribedToOtherForums, verifyCacheUserSubscribedToOtherForums } = require('../../forum/test/verifyForumSubscribe.js');

const { verifyDBDeleteThreadParent, verifyCacheDeleteThreadParent } = require('../../thread/test/verifyDeleteThread.js');
const { verifyDBUserHasCreatedThreads, verifyCacheUserHasCreatedThreads } = require('../../thread/test/verifyThreadByUser.js');
const { verifyDBUserReactedToOtherThreads, verifyCacheUserReactedToOtherThreads } = require('../../thread/test/verifyThreadReaction.js');

const { verifyDBDeleteCommentParent, verifyCacheDeleteCommentParent } = require('../../comment/test/verifyDeleteParent.js');
const { verifyDBUserHasCreatedComments, verifyCacheUserHasCreatedComments } = require('../../comment/test/verifyCommentByUser.js');

const { verifyDBTerminatedUserChats } = require('../../chat/test/verifyTerminatedUserChats.js');

const compareId = require('../../utils/general/compareId.js');

const userCount = 3;
const postCount = 2;
const postCommentCount = 3;
const forumCount = 2;
const threadCount = 2;
const threadCommentCount = 3;
const messageCount = 5;

let terminatedUserId, adminId, terminatedUserPostIds, terminatedUserForumIds, terminatedUserThreadIds;

let mainSuite = describe('POST /api/admin/accounts/terminate/:userId', () => {
    before(async () => {
        const userIds = (await addUsersToDB(userCount, true)).map(user => user._id);

        terminatedUserId = userIds[0];
        adminId = userIds[1];

        const addDataResults = await Promise.all([
            addPostsToDB(postCount, userIds, postCommentCount),
            addForumsToDB(forumCount, userIds, threadCount, threadCommentCount),
            addChatsToDB(userIds, messageCount)
        ]);

        const addPostsResult = addDataResults[0];

        const posts = addPostsResult.postData;
        
        terminatedUserPostIds = posts.filter(post => compareId(post.creator_id._id, terminatedUserId)).map(post => post._id);

        const postIds = posts.map(post => post._id);
        const postCommentIds = addPostsResult.postComments.map(comment => comment._id);

        const addForumsResult = addDataResults[1];

        const forums = addForumsResult.forumData;
        
        terminatedUserForumIds = forums.filter(forum => compareId(forum.creator_id._id, terminatedUserId)).map(forum => forum._id);

        const forumIds = forums.map(forum => forum._id);

        const threads = addForumsResult.threadData;

        terminatedUserThreadIds = threads.filter(thread => compareId(thread.creator_id._id, terminatedUserId)).map(thread => thread._id);

        const threadIds = threads.map(thread => thread._id);
        
        const threadCommentIds = addForumsResult.threadComments.map(comment => comment._id);

        const addChatsResult = addDataResults[2];

        const chatIds = addChatsResult.chatIds;
        const messageIds = addChatsResult.messageIds;

        // verify populated data
        mainSuite.suites.push(verifyPopulatedData([
            VERIFY_POPULATED_DATA_USERS,
            VERIFY_POPULATED_DATA_POSTS,
            VERIFY_POPULATED_DATA_POST_COMMENTS,
            VERIFY_POPULATED_DATA_FORUMS,
            VERIFY_POPULATED_DATA_THREADS,
            VERIFY_POPULATED_DATA_THREAD_COMMENTS,
            VERIFY_POPULATED_DATA_CHATS,
            VERIFY_POPULATED_DATA_MESSAGES
        ], {
            userIds,
            postIds,
            postCommentIds,
            forumIds,
            threadIds,
            threadCommentIds,
            chatIds,
            messageIds
        }));

        // generate and dynamically add tests to verify data before and after termination of user
        mainSuite.suites.push(generateTerminateUserTestContext(false));
        mainSuite.suites.push(generateTerminateUserTestContext(true));
    });

    // clean up and exit
    after(exitAfterTest);

    generatePlaceholderBlock();
});

// function to generate context for user termination test
function generateTerminateUserTestContext(terminated) {
    return generateContextFromTests(terminated, 'terminating', generateTerminateUserTests(terminated));
}

// generate tests for user termination
function generateTerminateUserTests(terminated) {
    // common params
    const params = [terminatedUserId, terminated];
    // test cases
    // before terminating
    //      terminated user should not have terminated status yet
    //      terminated user should be following other users
    //      terminated user should be blocking other users
    //      other users should be following terminated user
    //      other users should be blocking terminated user
    //      terminated user should have created posts, forums, threads, comments, and have chats and messages
    //      messages should exist in the terminated user's enrolled chats
    //      threads should exist for the terminated user's created forums
    //      comments should exist for the terminated user's created posts
    //      comments should exist for the terminated user's created threads
    //      terminated user should have liked other users' posts
    //      terminated user should have saved other users' posts
    //      terminated user should have subscribed to other users' forums
    //      terminated user should have liked other users' threads
    //      terminated user should have disliked other users' threads
    // after terminating
    //      terminated user should have Terminated status
    //      terminated user should not be following other users
    //      terminated user should not be blocking other users
    //      other users should not be following terminated user
    //      other users should not be blocking terminated user
    //      terminated user should not have created posts, forums, threads, comments, and should not have chats and messages
    //      messages should not exist in the terminated user's enrolled chats
    //      threads should not exist for the terminated user's created forums
    //      comments should not exist for the terminated user's created posts
    //      comments should not exist for the terminated user's created threads
    //      terminated user should not have liked other users' posts
    //      terminated user should not have saved other users' posts
    //      terminated user should not have subscribed to other users' forums
    //      terminated user should not have liked other users' threads
    //      terminated user should not have disliked other users' threads
    const tests = [
        // check if terminated user has the Terminated status in database and cache
        {
            title: generateTestTitle(!terminated, 'Terminated status', true, 'have'),
            callback: verifyDBUserTerminated,
            params
        },
        {
            title: generateTestTitle(!terminated, 'Terminated status', false, 'have'),
            callback: verifyCacheUserTerminated,
            params
        },
        // check if terminated user is following other users in database and cache
        {
            title: generateTestTitle(terminated, 'following other users', true, 'be'),
            callback: verifyDBIsFollowingAny,
            params
        },
        {
            title: generateTestTitle(terminated, 'following other users', false, 'be'),
            callback: verifyCacheIsFollowingAny,
            params
        },
        // check if terminated user is blocking other users in database and cache
        {
            title: generateTestTitle(terminated, 'blocking other users', true, 'be'),
            callback: verifyDBUserIsBlockingAny,
            params
        },
        {
            title: generateTestTitle(terminated, 'blocking other users', false, 'be'),
            callback: verifyCacheUserIsBlockingAny,
            params
        },
        // check if other users are following terminated user in database and cache
        {
            title: generateTestTitle(terminated, 'following terminated user', true, 'be'),
            callback: verifyDBHasFollowers,
            params
        },
        {
            title: generateTestTitle(terminated, 'following terminated user', false, 'be'),
            callback: verifyCacheHasFollowers,
            params
        },
        // check if other users are blocking terminated user in database and cache
        {
            title: generateTestTitle(terminated, 'blocking terminated user', true, 'be'),
            callback: verifyDBUserIsBlockedByAny,
            params
        },
        {
            title: generateTestTitle(terminated, 'blocking terminated user', false, 'be'),
            callback: verifyCacheUserIsBlockedByAny,
            params
        },
        // check if terminated user has created posts in database and cache
        {
            title: generateTestTitle(terminated, 'posts created by terminated user', true),
            callback: verifyDBUserHasCreatedPosts,
            params
        },
        {
            title: generateTestTitle(terminated, 'posts created by terminated user', false),
            callback: verifyCacheUserHasCreatedPosts,
            params
        },
        // check if terminated user has created forums in database and cache
        {
            title: generateTestTitle(terminated, 'forums created by terminated user', true),
            callback: verifyDBUserHasCreatedForums,
            params
        },
        {
            title: generateTestTitle(terminated, 'forums created by terminated user', false),
            callback: verifyCacheUserHasCreatedForums,
            params
        },
        // check if terminated user has created threads in database and cache
        {
            title: generateTestTitle(terminated, 'threads created by terminated user', true),
            callback: verifyDBUserHasCreatedThreads,
            params
        },
        {
            title: generateTestTitle(terminated, 'threads created by terminated user', false),
            callback: verifyCacheUserHasCreatedThreads,
            params
        },
        // check if terminated user has created comments in database and cache
        {
            title: generateTestTitle(terminated, 'comments created by terminated user', true),
            callback: verifyDBUserHasCreatedComments,
            params
        },
        {
            title: generateTestTitle(terminated, 'comments created by terminated user', false),
            callback: verifyCacheUserHasCreatedComments,
            params
        },
        // check if terminated user has chats and messages in database
        {
            title: generateTestTitle(terminated, 'chats and messages created by terminated user', true),
            callback: verifyDBTerminatedUserChats,
            params
        },
        // check if threads exist under the terminated user's forums in database and cache
        {
            title: generateTestTitle(terminated, 'threads under forums created by terminated user', true),
            callback: verifyDBDeleteThreadParent,
            params: [terminatedUserForumIds, terminated]
        },
        {
            title: generateTestTitle(terminated, 'threads under forums created by terminated user', false),
            callback: verifyCacheDeleteThreadParent,
            params: [terminatedUserForumIds, terminated]
        },
        // check if comments exist under the terminated user's posts in database and cache
        {
            title: generateTestTitle(terminated, 'comments under posts created by terminated user', true),
            callback: verifyDBDeleteCommentParent,
            params: [terminatedUserPostIds, terminated]
        },
        {
            title: generateTestTitle(terminated, 'comments under posts created by terminated user', false),
            callback: verifyCacheDeleteCommentParent,
            params: [terminatedUserPostIds, PARENT_MODEL_POST, terminated]
        },
        // check if comments exist under the terminated user's threads in database and cache
        {
            title: generateTestTitle(terminated, 'comments under threads created by terminated user', true),
            callback: verifyDBDeleteCommentParent,
            params: [terminatedUserThreadIds, terminated]
        },
        {
            title: generateTestTitle(terminated, 'comments under threads created by terminated user', false),
            callback: verifyCacheDeleteCommentParent,
            params: [terminatedUserThreadIds, PARENT_MODEL_THREAD, terminated]
        },
        // check if terminated user has liked posts by other users
        {
            title: generateTestTitle(terminated, 'liked posts created by other users', true, 'have'),
            callback: verifyDBUserReactedToOtherPosts,
            params: [terminatedUserId, terminated, true]
        },
        {
            title: generateTestTitle(terminated, 'liked posts created by other users', false, 'have'),
            callback: verifyCacheUserReactedToOtherPosts,
            params: [terminatedUserId, terminated, true]
        },
        // check if terminated user has saved posts by other users
        {
            title: generateTestTitle(terminated, 'saved posts created by other users', true, 'have'),
            callback: verifyDBUserReactedToOtherPosts,
            params: [terminatedUserId, terminated, false]
        },
        {
            title: generateTestTitle(terminated, 'saved posts created by other users', false, 'have'),
            callback: verifyCacheUserReactedToOtherPosts,
            params: [terminatedUserId, terminated, true]
        },
        // check if terminated user has subscribed to forums by other users
        {
            title: generateTestTitle(terminated, 'subscribed to forums created by other users', true, 'have'),
            callback: verifyDBUserSubscribedToOtherForums,
            params
        },
        {
            title: generateTestTitle(terminated, 'subscribed to forums created by other users', false, 'have'),
            callback: verifyCacheUserSubscribedToOtherForums,
            params
        },
        // check if terminated user has liked threads by other users
        {
            title: generateTestTitle(terminated, 'liked threads created by other users', true, 'have'),
            callback: verifyDBUserReactedToOtherThreads,
            params: [terminatedUserId, terminated, true]
        },
        {
            title: generateTestTitle(terminated, 'liked threads created by other users', false, 'have'),
            callback: verifyCacheUserReactedToOtherThreads,
            params: [terminatedUserId, terminated, true]
        },
        // check if terminated user has disliked threads by other users
        {
            title: generateTestTitle(terminated, 'disliked threads created by other users', true, 'have'),
            callback: verifyDBUserReactedToOtherThreads,
            params: [terminatedUserId, terminated, false]
        },
        {
            title: generateTestTitle(terminated, 'disliked threads created by other users', false, 'have'),
            callback: verifyCacheUserReactedToOtherThreads,
            params: [terminatedUserId, terminated, false]
        },
    ];

    // if to terminate then add test to send request
    if (terminated) {
        tests.unshift({
            title: 'should return 200',
            callback: terminateUser,
            params: [terminatedUserId, adminId]
        });
    }

    return tests;
}