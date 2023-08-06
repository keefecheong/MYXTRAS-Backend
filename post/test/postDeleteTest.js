// to test if deleting a post deletes associated child comments successfully

const { PARENT_MODEL_POST } = require('../../comment/models/comment.js');

const exitAfterTest = require('../../utils/test/exitAfterTest.js');
const generateContextFromTests = require('../../utils/test/generateContextFromTests.js');

const addUsersToDB = require('../../user/test/populateUsers.js');
const addPostsToDB = require('./populatePosts.js');

const { verifyDBPopulatedUsers, verifyCachePopulatedUsers } = require('../../user/test/verifyPopulateUsers.js');
const { verifyDBPopulatedPosts, verifyCachePopulatedPosts } = require('./verifyPopulatePosts.js');
const { deletePost, verifyDBDeletePost, verifyCacheDeletePost } = require('./verifyDeletePost.js');
const { verifyDBPopulatedComments, verifyCachePopulatedComments } = require('../../comment/test/verifyPopulateComments.js');
const { verifyDBDeleteCommentParent, verifyCacheDeleteCommentParent } = require('../../comment/test/verifyDeleteParent.js');

// main test block
let mainSuite = describe('DELETE /api/posts/:postId', async () => {
    const userCount = 2;
    const postCount = 2;
    const commentCount = 5;
    let userIds, posts, postComments;

    before(async () => {
        // populate users, posts, and comments
        // and simulate requests to populate cache
        userIds = await addUsersToDB(userCount);

        const addPostResults = await addPostsToDB(postCount, userIds, commentCount);
        
        posts = addPostResults.postData;
        postComments = addPostResults.postComments;

        // generate and dynamically add tests to verify data before and after deletion of post
        const creatorId = posts[0].creator_id;
        const postId = posts[0]._id;

        mainSuite.suites.push(generateDeletePostTestContexts(postId, creatorId, false));
        mainSuite.suites.push(generateDeletePostTestContexts(postId, creatorId, true));
    });
    
    // clean up and exit
    after(exitAfterTest);

    // check that data is populated correctly
    context('verifying data populated', async() => {
        it('should add users to database', async () => {
            await verifyDBPopulatedUsers(userIds);
        });

        it('should populate users in cache', async () => {
            await verifyCachePopulatedUsers(userIds);
        });

        it('should add posts to database', async () => {
            await verifyDBPopulatedPosts(posts.map(post => post._id));
        });

        it('should populate posts in cache', async () => {
            await verifyCachePopulatedPosts(userIds);
        });

        it('should add comments to database', async () => {
            await verifyDBPopulatedComments(postComments.map(comment => comment._id));
        });

        it('should populate comments in cache', async () => {
            await verifyCachePopulatedComments(posts.map(post => post._id), PARENT_MODEL_POST);
        });
    });
});

// generate context for post deletion tests
function generateDeletePostTestContexts(postId, creatorId, deleted) {
    return generateContextFromTests(`${ deleted ? 'after' : 'before' } delete`, generateDeletePostTests(postId, creatorId, deleted));
}

// generate tests for post deletion
function generateDeletePostTests(postId, creatorId, deleted) {
    // store callback and params separately to execute later

    // test cases
    // before deleting:
    //      post should be present in database and cache
    //      comments should be present in database (if post has comments) and cache
    // after deleting:
    //      post should not be present in both database and cache
    //      comments should not be present in both database and cache
    const tests = [
        {
            title: `should ${ deleted ? 'not ' : '' }contain post in database`,
            callback: verifyDBDeletePost,
            params: [postId, deleted]
        },
        {
            title: `should ${ deleted ? 'not ' : '' }contain post in cache`,
            callback: verifyCacheDeletePost,
            params: [creatorId, postId, deleted]
        },
        {
            title: `should ${ deleted ? 'not ' : '' }contain comments in database`,
            callback: verifyDBDeleteCommentParent,
            params: [postId, deleted]
        },
        {
            title: `should ${ deleted ? 'not ' : '' }contain comments in cache`,
            callback: verifyCacheDeleteCommentParent,
            params: [postId, PARENT_MODEL_POST, deleted]
        }
    ];

    // if to delete then add test to send delete request
    if (deleted) {
        tests.unshift({
            title: 'should return 200',
            callback: deletePost,
            params: [creatorId, postId]
        });
    }

    return tests;
}