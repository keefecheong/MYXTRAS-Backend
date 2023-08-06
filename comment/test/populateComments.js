// to populate comments

const { Comment } = require('../models/comment.js');

// to add comments to database then populate cache
module.exports = async function addCommentsToDB(count, parentIds, parentModel, creatorIds) {
    const comments = parentIds.flatMap(parentId => 
        creatorIds.flatMap(creatorId => 
            generateCommentsPerCreatorAndParent(count, parentId, parentModel, creatorId)
        )
    );

    // add comments to database
    await Comment.insertMany(comments);

    return comments.map(comment => { 
        return {
            _id: comment._id,
            parent_id: comment.parent_id,
            parent_model: comment.parent_model,
            creator_id: comment.creator_id
        }
    });
}

// generate <count> comments by a user under a parent
function generateCommentsPerCreatorAndParent(count, parentId, parentModel, creatorId) {
    const comments = [];

    for (let i = 0; i < count; i++) {
        comments.push(new Comment({
            creator_id: creatorId,
            content: `comment ${i}`,
            parent_id: parentId,
            parent_model: parentModel
        }));
    }
    
    return comments;
}