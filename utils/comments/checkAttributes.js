// functions to check attributes of comments before returning data to frontend

// add fields to the comment object:
// check if the requesting user is the owner of the comment
// for an array of comments
function checkCommentAttributesAll(comments, userId) {
    let result = [];

    for (let i = 0; i < comments.length; i++) {
        result.push(checkCommentAttributes(comments[i], userId));
    }

    return result;
}

// for one comment
function checkCommentAttributes(comment, userId) {
    comment.isOwner = comment.creator_id._id.equals(userId);

    return comment;
}

module.exports = {
    checkCommentAttributes,
    checkCommentAttributesAll
}