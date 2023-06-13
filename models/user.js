const { required, string } = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    real_name: {
        type: String
    },
    phone_number: {
        type: String,
        required: true
    },
    school: {
        type: String
    },
    course: {
        type: String
    },
    profile_pic_link: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
    },
    gender:{
        type: String
    },
    biography: {
        type: String,
        default: function() {
            return `Hi! I am ${this.username}.`;
        }
    },
    following: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    followers: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    saved_posts: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Post'
        }],
        default: []
    },
    subscribed_forums: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Forum'
        }],
        default: []
    },
    interests: {
        type: [String],
        default: []
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    },
    password: {
        type: String,
        required: true
    },
    is_profile_setup: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);