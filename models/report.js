const mongoose = require('mongoose');

// valid report_target_type values
const REPORT_TARGET_TYPE_USER = 'User';
const REPORT_TARGET_TYPE_POST = 'Post';
const REPORT_TARGET_TYPE_THREAD = 'Thread';
const REPORT_TARGET_TYPE_COMMENT = 'Comment';
const REPORT_TARGET_TYPE_MESSAGE = 'Message';

// valid report_status values
const REPORT_STATUS_SUBMITTED = 'Submitted';
const REPORT_STATUS_SUCCESS = 'Success';
const REPORT_STATUS_FAILED = 'Failed';

// to craft report_message
const REPORT_MESSAGE_SUBMITTED = 'Report submitted successfully, please wait for the review by our moderation team.';

// append report_target_type
const REPORT_MESSAGE_REVIEWED_PREFIX = 'Thank you for reporting. We have reviewed the';

const REPORT_MESSAGE_SUCCESS_USER = 'User has been issued a warning.';
const REPORT_MESSAGE_SUCCESS_OTHER = 'Content has been removed.';

const REPORT_MESSAGE_FAILED = 'No action was deemed required.';

const reportSchema = new mongoose.Schema({
    report_target: {
        type: mongoose.SchemaTypes.ObjectId,
        refPath: 'report_target_type',
        required: true,
        immutable: true
    },
    report_target_type: {
        type: String,
        required: true,
        immutable: true,
        enum: [
            REPORT_TARGET_TYPE_USER,
            REPORT_TARGET_TYPE_POST,
            REPORT_TARGET_TYPE_THREAD,
            REPORT_TARGET_TYPE_COMMENT,
            REPORT_TARGET_TYPE_MESSAGE
        ]
    },
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    creation_time: {
        type: Date,
        default: Date.now(),
        immutable: true
    },
    status: {
        type: String,
        default: REPORT_STATUS_SUBMITTED,
        enum: [
            REPORT_STATUS_SUBMITTED,
            REPORT_STATUS_SUCCESS,
            REPORT_STATUS_FAILED
        ]
    },
    reviewer_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: function() {
            return this.status != REPORT_STATUS_SUBMITTED;
        }
    },
    review_time: {
        type: Date,
        required: function() {
            return this.status != REPORT_STATUS_SUBMITTED;
        }
    }
});

// virtual property to craft message for report outcome
reportSchema.virtual('report_message').get(function() {
    // if not reviewed return REPORT_MESSAGE_SUBMITTED
    if (this.status == REPORT_STATUS_SUBMITTED) {
        return REPORT_MESSAGE_SUBMITTED;
    }

    let message = `${REPORT_MESSAGE_REVIEWED_PREFIX} ${this.report_target_type}, and `;

    // if report successful tell user the action taken
    if (this.status == REPORT_STATUS_SUCCESS) {
        message += `appropriate action has been taken: ${this.report_target_type == REPORT_TARGET_TYPE_USER ? REPORT_MESSAGE_SUCCESS_USER : REPORT_MESSAGE_SUCCESS_OTHER}`;
    }
    // otherwise return REPORT_MESSAGE_FAILED
    else if (this.status == REPORT_STATUS_FAILED) {
        message += REPORT_MESSAGE_FAILED;
    }

    return message;
});

reportSchema.set('toObject', { virtuals: true });

module.exports = {
    Report: mongoose.model('Report', reportSchema),
    REPORT_TARGET_TYPE_USER,
    REPORT_TARGET_TYPE_POST,
    REPORT_TARGET_TYPE_THREAD,
    REPORT_TARGET_TYPE_COMMENT,
    REPORT_TARGET_TYPE_MESSAGE,
    REPORT_STATUS_SUBMITTED,
    REPORT_STATUS_SUCCESS,
    REPORT_STATUS_FAILED
}