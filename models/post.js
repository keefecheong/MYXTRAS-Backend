const mongoose = require('mongoose');
const { User } = require('./user.js');
const Comment = require('./comment.js');
const { deleteFiles } = require('../utils/general/firebaseStorageDelete.js');

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
        default: Date.now()
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

// automatically clean up files and comments associated with the post on delete
postSchema.post('findOneAndDelete', async function(doc, next) {
    try {
        // delete associated images
        deleteFiles(doc.content_links);

        const promises = [
            // delete associated comments
            Comment.deleteMany({ parent_id: doc._id }).catch(error => console.log(error)),
            // remove saved_posts entry for those with the deleted document's id as its post_id
            User.updateMany(
                { 'saved_posts.post_id': doc._id },
                { $pull: { saved_posts: { post_id: doc._id } } }
            )
        ];

        Promise.all(promises).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});

module.exports = mongoose.model('Post', postSchema);