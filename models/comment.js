const mongoose = require('mongoose');
const Post = require('./post.js');

// valid parent_model values
const PARENT_MODEL_POST = 'Post';
const PARENT_MODEL_THREAD = 'Thread';

const commentSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: Date.now()
    },
    content: {
        type: String,
        immutable: true,
        required: true
    },
    parent_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        immutable: true,
        refPath: 'parent_model'
    },
    parent_model: {
        type: String,
        enum: [
            PARENT_MODEL_POST,
            PARENT_MODEL_THREAD
        ],
        immutable: true
    }
});

// custom query to get creator details
commentSchema.query.getCreator = function (getRealname) {
    return this.populate({
        path: 'creator_id',
        select: `username profile_pic_link ${getRealname ? 'real_name' : ''}`
    });
}

// custom query crafted based on given arguments
commentSchema.statics.commonQuery = function (filter, sort, cache, cacheOptions) {
    const query = this
        .find(filter)
        .select('-parent_id -parent_model')
        .sort(sort ?? { creation_time: -1 })
        .getCreator()
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}

// automatically increment parent object's comment_count by 1 on save
commentSchema.pre('save', async function (next) {
    if (!this.isNew) {
        return next();
    }

    try {
        const parentModel = mongoose.model(this.parent_model);

        parentModel.findByIdAndUpdate(
            this.parent_id,
            { $inc: { comment_count: 1 } }
        ).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});

// automatically decrement parent object's comment_count by 1 on delete
commentSchema.post('findOneAndDelete', async function (doc, next) {
    try {
        const parentModel = mongoose.model(doc.parent_model);

        parentModel.findByIdAndUpdate(
            doc.parent_id,
            { $inc: { comment_count: -1 } }
        ).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});

module.exports = {
    Comment: mongoose.model('Comment', commentSchema),
    PARENT_MODEL_POST,
    PARENT_MODEL_THREAD
}