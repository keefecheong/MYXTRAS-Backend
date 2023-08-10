// to test if blocking a user will behave as intended

const Mocha = require('mocha');

const exitAfterTest = require('../../utils/test/exitAfterTest.js');
const generateContextFromTests = require('../../utils/test/generateContextFromTests.js');
const generateTestTitle = require('../../utils/test/generateTestTitle.js');
const generatePlaceholderBlock = require('../../utils/test/generatePlaceholderBlock.js');
const {
    VERIFY_POPULATED_DATA_USERS,
    VERIFY_POPULATED_DATA_POSTS,
    VERIFY_POPULATED_DATA_POST_COMMENTS,
    verifyPopulatedData
} = require('../../utils/test/verifyPopulatedData.js');

const addUsersToDB = require('./populateUsers.js');
const addPostsToDB = require('../../post/test/populatePosts.js');

const { blockUser, verifyDBBlockUser, verifyCacheBlockUser } = require('./verifyBlockUser.js');
const { verifyDBFollowing, verifyCacheFollowing } = require('./verifyUserFollowers.js');
const { verifyDBUserReactedToUserPosts, verifyCacheUserReactedToUserPosts } = require('../../post/test/verifyPostReaction.js');
const { verifyCommentedOnUserPost } = require('../../comment/test/verifyCommentByUser.js');

const userCount = 2;
const postCount = 5;
const commentCount = 5;

let blockerId, blockedId;

let mainSuite = describe('POST /api/users/:userId/block', () => {
    before(async () => {
        // populate users, posts, and comments
        const userIds = (await addUsersToDB(userCount)).map(user => user._id);

        const addPostsResult = await addPostsToDB(postCount, userIds, commentCount);

        const postIds = addPostsResult.postData.map(post => post._id);
        const postCommentIds = addPostsResult.postComments.map(comment => comment._id);

        // verify populated data
        mainSuite.suites.push(verifyPopulatedData([
            VERIFY_POPULATED_DATA_USERS,
            VERIFY_POPULATED_DATA_POSTS,
            VERIFY_POPULATED_DATA_POST_COMMENTS
        ], {
            userIds,
            postIds,
            postCommentIds
        }));

        // generate and dynamically add tests to verify data before and after blocking a user
        blockerId = userIds[0];
        blockedId = userIds[1];

        mainSuite.suites.push(generateBlockUserTestContext(false));
        mainSuite.suites.push(generateBlockUserTestContext(true));
    });

    // clean up and exit
    after(exitAfterTest);

    generatePlaceholderBlock();
});

// generate context for user blocking tests
function generateBlockUserTestContext(blocked) {
    const suite = new Mocha.Suite(`${ blocked ? 'after' : 'before' } blocking`);

    suite.suites = [
        generateContextFromTests(null, null, generateBlockUserTests(blocked, true), 'for blocking user'),
        generateContextFromTests(null, null, generateBlockUserTests(blocked, false), 'for blocked user')
    ];

    return suite;
}

// generate tests for blocking a user
function generateBlockUserTests(blocked, forBlockingUser) {
    const userId1 = forBlockingUser ? blockerId : blockedId;
    const userId2 = forBlockingUser ? blockedId : blockerId;

    const otherUserName = forBlockingUser ? 'blocked user' : 'blocking user';

    // test cases
    // before blocking:
    //      blocking user should not have blocked user in his blocked_users entry
    //      both users should be following each other
    //      both users should have liked, saved, and commented on the other user's posts
    //      both users should have liked, saved, and commented on their own posts
    // after blocking:
    //      blocking user should have blocked user in his blocked_users entry
    //      both users should not be following each other
    //      both users should not have liked, saved, and commented on the other user's posts
    //      both users should have liked, saved, and commented on their own posts
    const tests = [
        // checks if userId1 is following userId2
        {
            title: generateTestTitle(blocked, otherUserName, true, 'be following'),
            callback: verifyDBFollowing,
            params: [userId1, userId2, blocked]
        },
        {
            title: generateTestTitle(blocked, otherUserName, false, 'be following'),
            callback: verifyCacheFollowing,
            params: [userId1, userId2, blocked]
        },
        // checks if userId1 has liked any posts created by userId2
        {
            title: generateTestTitle(blocked, `liked ${otherUserName}'s posts`, true, 'have'),
            callback: verifyDBUserReactedToUserPosts,
            params: [userId1, userId2, blocked, true]
        },
        {
            title: generateTestTitle(blocked, `liked ${otherUserName}'s posts`, false, 'have'),
            callback: verifyCacheUserReactedToUserPosts,
            params: [userId1, userId2, blocked, true]
        },
        // check if userId1 has saved any posts created by userId2
        {
            title: generateTestTitle(blocked, `saved ${otherUserName}'s posts`, true, 'have'),
            callback: verifyDBUserReactedToUserPosts,
            params: [userId1, userId2, blocked, false]
        },
        {
            title: generateTestTitle(blocked, `saved ${otherUserName}'s posts`, false, 'have'),
            callback: verifyCacheUserReactedToUserPosts,
            params: [userId1, userId2, blocked, false]
        },
        // check if userId1 has created any comments under posts created by userId2
        {
            title: generateTestTitle(blocked, `comments on ${otherUserName}' posts`, true),
            callback: verifyCommentedOnUserPost,
            params: [userId1, userId2, blocked, true]
        },
        {
            title: generateTestTitle(blocked, `comments on ${otherUserName}' posts`, false),
            callback: verifyCommentedOnUserPost,
            params: [userId1, userId2, blocked, false]
        },
        // check if user has liked his own posts
        {
            title: generateTestTitle(false, 'liked self\'s posts', true, 'have'),
            callback: verifyDBUserReactedToUserPosts,
            params: [userId1, userId1, false, true]
        },
        {
            title: generateTestTitle(false, 'liked self\'s posts', false, 'have'),
            callback: verifyCacheUserReactedToUserPosts,
            params: [userId1, userId1, false, true]
        },
        // check if user has saved his own posts
        {
            title: generateTestTitle(false, 'saved self\'s posts', true, 'have'),
            callback: verifyDBUserReactedToUserPosts,
            params: [userId1, userId1, false, false]
        },
        {
            title: generateTestTitle(false, 'saved self\'s posts', false, 'have'),
            callback: verifyCacheUserReactedToUserPosts,
            params: [userId1, userId1, false, false]
        },
        // check if user has created comments under his own posts
        {
            title: generateTestTitle(false, 'comments on self\'s posts', true),
            callback: verifyCommentedOnUserPost,
            params: [userId1, userId1, false, true]
        },
        {
            title: generateTestTitle(false, 'comments on self\'s posts', false),
            callback: verifyCommentedOnUserPost,
            params: [userId1, userId1, false, false]
        }
    ];

    // if for blocking user then add test for blocked_users entry
    if (forBlockingUser) {
        // check if blocking user has blocked_users entry for the blocked user
        tests.unshift({
            title: generateTestTitle(!blocked, 'blocked_users entry', false),
            callback: verifyCacheBlockUser,
            params: [userId1, userId2, blocked]
        });
        tests.unshift({
            title: generateTestTitle(!blocked, 'blocked_users entry', true),
            callback: verifyDBBlockUser,
            params: [userId1, userId2, blocked]
        });
    }

    // if to block user then add test to send request
    if (blocked && forBlockingUser) {
        tests.unshift({
            title: 'should return 200',
            callback: blockUser,
            params: [blockerId, blockedId]
        });
    }

    return tests;
}