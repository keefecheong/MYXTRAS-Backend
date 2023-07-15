// controller functions related to thread comments

const { Comment, PARENT_MODEL_THREAD } = require('../../models/comment.js');

const { checkCommentAttributesAll } = require('../../utils/comments/checkAttributes.js');
const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');
const performAllSync = require('../../utils/cache/performAllSync.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getForumThreadKey } = require('../../cache/threads/threadCache.js');
const { getThreadCommentKey } = require('../../cache/comments/commentCache.js');
const { cacheNewComment } = require('../../cache/comments/commentUpdateCache.js');
const { deleteCachedComment } = require('../../cache/comments/commentDeleteCache.js');

// get all comments for a thread
async function getThreadComments(req, res) {
    try {
        const threadId = res.thread._id;

        var threadComments = await Comment.commonQuery({
            parent_id: threadId
        }, null, true, {
            key: getThreadCommentKey(threadId)
        });

        threadComments = checkCommentAttributesAll(threadComments, req.user._id);

        returnGoodReq(res, threadComments);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// add comment to thread
async function createComment(req, res) {
    // check if comment content is provided
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        return returnBadReq(res, 'Comment content is required.');
    }

    const creator = req.user;
    const thread = res.thread;

    const comment = new Comment({
        creator_id: creator._id,
        content: req.body.content,
        creation_time: Date.now(),
        parent_id: thread._id,
        parent_model: PARENT_MODEL_THREAD
    });
    
    try {
        const userDetails = {
            _id: creator._id,
            username: creator.username,
            profile_pic_link: creator.profile_pic_link
        }

        const jsonComment = comment.toObject();
        jsonComment.creator_id = userDetails;
    
        delete jsonComment.parent_id;
        delete jsonComment.parent_model;

        // store new comment in cache if key exists or update database otherwise
        const updateCacheResult = await cacheNewComment(false, jsonComment, res.threadFromCache, getForumThreadKey(thread.parent_id._id), thread._id);

        // save comment asynchronously if cache is updated, and synchronously otherwise
        await saveDocAsync(comment, updateCacheResult);

        jsonComment.isOwner = true;

        returnGoodReq(res, { message: 'Comment created.', comment: jsonComment });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// delete comment
async function deleteComment(req, res) {
    // check if requesting user is the creator of the comment
    // if the requesting user is not the creator then return 401 error
    if (!compareId(req.user._id, res.comment.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    try{
        const commentId = req.params.commentId;
        let promises = [];
        
        // update cache
        promises = deleteCachedComment(false, commentId, res.commentFromCache, res.threadFromCache, getForumThreadKey(res.thread.parent_id._id), res.thread._id);

        // delete from cache and database together
        await performAllSync(promises, Comment.findByIdAndDelete(commentId));

        returnGoodReq(res, { message: 'Comment removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getThreadComments,
    createComment,
    deleteComment
}