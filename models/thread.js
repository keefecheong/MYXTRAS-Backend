const mongoose = require('mongoose');
const { Comment } = require('./comment.js');
const { deleteFiles } = require('../utils/firebase/firebaseStorageDelete.js');

const threadSchema = new mongoose.Schema({
    parent_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Forum',
        required: true,
        immutable: true
    },
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: function() {
            return Date.now();
        }
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true
    },
    content_link: {
        type: String
    },
    comment_count: {
        type: Number,
        default: 0,
    },
    likes: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'User' }],
        default: []
    },
    dislikes: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, 
            ref: 'User' }],
        default: []
    },
    tags: {
        type: [String],
        default: []
    }
});

// custom query to get parent forum details
threadSchema.query.getForum = function() {
    return this.populate({
        path: 'parent_id',
        select: 'forum_name forum_id forum_pic_link'
    });
}

// custom query to get creator details
threadSchema.query.getCreator = function() {
    return this.populate({ 
        path: 'creator_id',
        select: 'username profile_pic_link'
    });
}

// craft query based on given arguments
threadSchema.statics.commonQuery = function (filter, sort, cache, cacheOptions) {
    const query = this
        .find(filter)
        .sort(sort ?? { creation_time: -1 })
        .getForum()
        .getCreator()
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}

// to remove all threads under a forum or created by a user
threadSchema.statics.deleteAllSpecified = async function(forumId, userId, asJSON) {
    let filter = {};

    if (forumId) {
        filter = {
            parent_id: forumId
        };
    }

    if (userId) {
        filter = {
            creator_id: userId
        };
    }

    const threads = await this.find(filter, { _id: 1, content_link: 1 });

    const updateCommentPromise = Comment.deleteAllSpecified(threads.map(thread => thread._id), userId, true);

    // clean up images for all threads
    threads.forEach(thread => this.cleanUpOnDeleteThread(thread._id, thread.content_link, true));

    // delete threads
    const deleteThreadsPromise = asJSON ? { deleteMany: { filter } } : this.deleteMany(filter);

    // if asJSON is true return JSON objects else return promise for all
    return asJSON ? { deleteThreadsPromise, updateCommentPromise } : Promise.all([deleteThreadsPromise, Comment.bulkWrite(bulkWriteComments)]);
}

// to remove all likes/dislikes by a specified user
threadSchema.statics.removeThreadReactionByUser = function(userId, forLikes) {
    let filter = {};
    let update = {};
    const subFilter = { $in: [userId] };

    if (forLikes) {
        filter.likes = subFilter;
        update = {
            $pull: { likes: userId }
        };
    }
    else {
        filter.dislikes = subFilter;
        update = {
            $pull: { dislikes: userId }
        };
    }

    return { updateMany: { filter, update } };
}

// to clean up child comments and delete associated images when deleted
threadSchema.statics.cleanUpOnDeleteThread = async function(threadId, contentLink, asJSON, userId) {
    // delete associated image if exists
    if (contentLink) {
        deleteFiles([contentLink]);
    }

    // delete associated comments
    return Comment.deleteAllSpecified([threadId], userId, asJSON);
}

// automatically clean comments associated with the thread on delete
threadSchema.post('findOneAndDelete', function(doc, next) {
    this.model.cleanUpOnDeleteThread(doc._id, doc.content_link, false).catch(error => console.log(error));

    next();
});


module.exports = mongoose.model('Thread', threadSchema);