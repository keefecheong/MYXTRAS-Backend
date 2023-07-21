const mongoose = require('mongoose');
const { User, FIELD_SAVED_POSTS } = require('./user.js');
const { Comment } = require('./comment.js');
const { deleteFiles } = require('../utils/firebase/firebaseStorageDelete.js');

const postSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    content_links: {
        type: [String],
        required: true
    },
    original_names: {
        type: [String],
        required: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: function() {
            return Date.now();
        }
    },
    last_modified_time: {
        type: Date,
        default: function() {
            return this.creation_time;
        }
    },
    likes: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    comment_count: {
        type: Number,
        default: 0
    },
    caption: {
        type: String
    },
    location: {
        type: String
    },
    comments_enabled: {
        type: Boolean,
        default: true
    },
    tags: {
        type: [String],
        default: []
    }
});

// custom query to get creator details
postSchema.query.getCreator = function() {
    return this.populate({
        path: 'creator_id',
        select: 'username profile_pic_link blocked_users.user_id'
    });
}

// craft query based on given arguments
postSchema.statics.commonQuery = function (filter, sort, cache, cacheOptions) {
    const query = this
        .find(filter)
        // set default sorting to descending creation_time
        .sort(sort ?? { creation_time: -1 })
        .getCreator()
        .lean();

    // set cache if true
    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}

// delete all posts by a specified user and clean up
postSchema.statics.deleteByUser = async function(userId) {
    const filter = { creator_id: userId };
    
    // promise to delete all posts created by the specified userId
    const deletePostsPromise = { deleteMany: { filter } };
    const updateUserPromises = [];
    const updateCommentPromise = Comment.deleteAllSpecified(null, userId, true);
    
    const posts = await this.find(filter, { _id: 1, content_links: 1 });

    // get promises to clean up for each post deleted
    posts.forEach(post => {
        const promises = this.cleanUpOnDeletePost(post._id, post.content_links, true);

        updateUserPromises.push(promises[1]);
    });

    return { deletePostsPromise, updateUserPromises, updateCommentPromise };
}

// remove all likes by the specified userId
postSchema.statics.removeLikesByUser = function(userId, creatorId) {
    const filter = {
        likes: {
            $in: [userId]
        }
    }

    if (creatorId) {
        filter.creator_id = creatorId;
    }

    const update = {
        $pull: { likes: userId }
    }

    // return JSON object for bulkWrite operation
    return { updateMany: { filter, update } };
}

// clean up associated data when deleting post
postSchema.statics.cleanUpOnDeletePost = function(postId, contentLinks, asJSON) {
    // delete associated images
    deleteFiles(contentLinks);

    const promises = [
        Comment.deleteAllSpecified([postId], null, asJSON),
        User.deleteFromArrayField(FIELD_SAVED_POSTS, [postId], asJSON)
    ]

    // delete comments and remove from users' saved_posts
    return asJSON ? promises : Promise.all(promises);
}

// automatically clean up files and comments associated with the post on delete
postSchema.post('findOneAndDelete', async function(doc, next) {
    this.model.cleanUpOnDeletePost(doc._id, doc.content_links, true).catch(error => console.log(error));

    next();
});

module.exports = mongoose.model('Post', postSchema);