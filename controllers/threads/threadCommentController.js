// controller functions related to thread comments

const Comment = require('../../models/comment.js');

const getCommentQuery = require('../../utils/comments/getCommentQuery.js');
const { checkCommentAttributesAll } = require('../../utils/comments/checkAttributes.js');
const compareId = require('../../utils/general/compareId.js');

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

        var threadComments = await getCommentQuery({
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

    const creatorId = req.user._id;
    const threadId = res.thread._id;

    const comment = new Comment({
        creator_id: creatorId,
        content: req.body.content,
        creation_time: Date.now(),
        parent_id: threadId,
        parent_model: 'Thread'
    });
    
    try {
        const userDetails = {
            _id: creatorId,
            username: req.user.username,
            profile_pic_link: req.user.profile_pic_link
        }

        const jsonComment = comment.toObject();
        jsonComment.creator_id = userDetails;
    
        delete jsonComment.parent_id;
        delete jsonComment.parent_model;

        // store new comment in cache if key exists or update database otherwise
        await cacheNewComment(comment, getThreadCommentKey(threadId), jsonComment, res.threadFromCache, getForumThreadKey(res.thread.parent_id._id), res.threadIndex);

        jsonComment.isOwner = true;

        returnGoodReq(res, { message: 'Comment created.', comment: jsonComment });
    }
    catch (error) {
        console.log(error)
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
        // if comment is in cache then update both cache and database immediately
        if (res.commentFromCache) {
            await deleteCachedComment(getThreadCommentKey(res.thread._id), res.commentIndex, req.params.commentId, res.threadFromCache, getForumThreadKey(res.thread.parent_id._id), res.threadIndex);
        }
        // otherwise update database immediately
        else {
            await Comment.findByIdAndDelete(req.params.commentId);
        }

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