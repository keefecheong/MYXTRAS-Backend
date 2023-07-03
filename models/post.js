const mongoose = require('mongoose');
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

// automatically clean up files and comments associated with the post on delete
postSchema.post('findOneAndDelete', async function(doc, next) {
    try {
        // delete associated images
        deleteFiles(doc.content_links);

        // delete associated comments
        const commentModel = mongoose.model('Comment');
        commentModel.deleteMany({ parent_id: doc._id }).catch(error => console.log(error));

        // remove from saved_posts
        const userModel = mongoose.model('User');
        const users = await userModel.find({ saved_posts: { $in: doc._id } });

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const saveIndex = user.saved_posts.indexOf(doc._id);
            user.saved_posts.splice(saveIndex, 1);
        }

        userModel.bulkSave(users).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});

module.exports = mongoose.model('Post', postSchema);