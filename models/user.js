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
    realname: {
        type: String
    },
    phonenumber: {
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
        type: String
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
    subscribedForums: {
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
    profilesetup: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);