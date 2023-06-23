const mongoose = require('mongoose');

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
        immutable: true
    },
    parent_model: {
        type: String,
        enum: ['Post', 'Thread'],
        immutable: true
    }
});

// automatically increment parent object's comment_count by 1 on save
commentSchema.pre('save', async function(next) {
    if (!this.isNew) {
        next();
    }

    try {
        const parentModel = this.parent_model == 'Post' ? mongoose.model('Post') : mongoose.model('Thread');
        
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
commentSchema.post('findOneAndDelete', async function(doc, next) {
    try {
        const parentModel = doc.parent_model == 'Post' ? mongoose.model('Post') : mongoose.model('Thread');
        
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

module.exports = mongoose.model('Comment', commentSchema);