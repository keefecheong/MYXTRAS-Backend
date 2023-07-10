// controller functions to handle actions for comments under posts

const Comment = require('../../models/comment.js');

const getCommentQuery = require('../../utils/comments/getCommentQuery.js');
const { checkCommentAttributesAll } = require('../../utils/comments/checkAttributes.js');
const compareId = require('../../utils/general/compareId.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getUserPostKey } = require('../../cache/posts/postCache.js');
const { getPostCommentKey } = require('../../cache/comments/commentCache.js');
const { cacheNewComment } = require('../../cache/comments/commentUpdateCache.js');
const { deleteCachedComment } = require('../../cache/comments/commentDeleteCache.js');

// retrieve all comments for a post
async function getComments(req, res) {
    try {
        const postId = res.post._id;

        const postComments = await getCommentQuery({
            parent_id: postId
        }, null, true, {
            key: getPostCommentKey(postId)
        });

        const comments = checkCommentAttributesAll(postComments, req.user._id);

        returnGoodReq(res, comments);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// create a comment and update the post's comments field
async function postComment(req, res) {
    // check if comments are enabled on the requested post
    // if enabled, continue to create comment
    // otherwise return 400 error
    if (!res.post.comments_enabled) {
        return returnBadReq(res, 'Comments are disabled for this post.');
    }

    // check if content is provided in the body
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        return returnBadReq(res, 'Comment content is required.');
    }

    const creatorId = req.user._id;
    const postId = req.post._id;

    // create new comment
    const comment = new Comment({
        creator_id: creatorId,
        content: req.body.content,
        creation_time: Date.now(),
        parent_id: postId,
        parent_model: 'Post'
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
        await cacheNewComment(comment, getPostCommentKey(postId), jsonComment, res.postFromCache, getUserPostKey(res.post.creator_id._id), res.postIndex);

        jsonComment.isOwner = true;

        returnGoodReq(res, { message: 'Comment created.', comment: jsonComment });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// delete a comment and update the post's comments field
async function deleteComment(req, res) {
    // check if the comment is posted by the requesting user
    // if creator is not the requesting user return 401 error
    if (!compareId(res.comment.creator_id._id, req.user._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        // if comment is in cache then update both cache and database immediately
        if (res.commentFromCache) {
            await deleteCachedComment(getPostCommentKey(res.post._id), res.commentIndex, req.params.commentId, res.postFromCache, getUserPostKey(res.post.creator_id._id), res.postIndex);
        }
        // otherwise delete comment from database immediately
        else {
            await Comment.findByIdAndDelete(req.params.commentId);
        }

        returnGoodReq(res, { message: 'Comment deleted.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getComments,
    postComment,
    deleteComment
}