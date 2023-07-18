const mongoose = require('mongoose');

// valid report_target_type values
const REPORT_TARGET_TYPE_USER = 'User';
const REPORT_TARGET_TYPE_POST = 'Post';
const REPORT_TARGET_TYPE_FORUM = 'Forum';
const REPORT_TARGET_TYPE_THREAD = 'Thread';
const REPORT_TARGET_TYPE_COMMENT = 'Comment';
const REPORT_TARGET_TYPE_MESSAGE = 'Message';

const REPORT_TARGET_TYPES = [
    REPORT_TARGET_TYPE_USER,
    REPORT_TARGET_TYPE_POST,
    REPORT_TARGET_TYPE_FORUM,
    REPORT_TARGET_TYPE_THREAD,
    REPORT_TARGET_TYPE_COMMENT,
    REPORT_TARGET_TYPE_MESSAGE
];

// valid report_reason values
// from: https://help.instagram.com/192435014247952
const REPORT_REASON_SPAM = 'Spam';
const REPORT_REASON_SEXUAL_ACTIVITY = 'Nudity or sexual activity';
const REPORT_REASON_HATE = 'Hate speech or symbols';
const REPORT_REASON_VIOLENCE = 'Violence or dangerous organisations';
const REPORT_REASON_BULLY = 'Bullying or harassment';
const REPORT_REASON_ILLEGAL_GOODS = 'Selling illegal or regulated goods';
const REPORT_REASON_IP_VIOLATION = 'Intellectual property violations';
const REPORT_REASON_SELF_INJURY = 'Suicide or self-injury';
const REPORT_REASON_EATING_DISORDER = 'Eating disorders';
const REPORT_REASON_SCAM = 'Scams or fraud';
const REPORT_REASON_FALSE_INFO = 'False information';

const REPORT_REASONS = [
    REPORT_REASON_SPAM,
    REPORT_REASON_SEXUAL_ACTIVITY,
    REPORT_REASON_HATE,
    REPORT_REASON_VIOLENCE,
    REPORT_REASON_BULLY,
    REPORT_REASON_ILLEGAL_GOODS,
    REPORT_REASON_IP_VIOLATION,
    REPORT_REASON_SELF_INJURY,
    REPORT_REASON_EATING_DISORDER,
    REPORT_REASON_SCAM,
    REPORT_REASON_FALSE_INFO
]

// valid report_status values
const REPORT_STATUS_SUBMITTED = 'Submitted';
const REPORT_STATUS_SUCCESS = 'Success';
const REPORT_STATUS_FAILED = 'Failed';

const REPORT_STATUSES = [
    REPORT_STATUS_SUBMITTED,
    REPORT_STATUS_SUCCESS,
    REPORT_STATUS_FAILED
];

const REPORT_MESSAGE_SUBMITTED = 'Report submitted successfully, please wait for the review by our moderation team.';

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
        enum: REPORT_TARGET_TYPES
    },
    report_reason: {
        type: String,
        required: true,
        immutable: true,
        enum: REPORT_REASONS
    },
    report_evidence: {
        type: String,
        immutable: true
    },
    reporter_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    report_time: {
        type: Date,
        default: Date.now(),
        immutable: true
    },
    status: {
        type: String,
        default: REPORT_STATUS_SUBMITTED,
        enum: REPORT_STATUSES
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
    // append report_target_type
    const REPORT_MESSAGE_REVIEWED_PREFIX = 'Thank you for reporting. We have reviewed the';
    
    const REPORT_MESSAGE_SUCCESS_USER = 'User has been issued a warning.';
    const REPORT_MESSAGE_SUCCESS_OTHER = 'Content has been removed.';
    
    const REPORT_MESSAGE_FAILED = 'No action was deemed required.';

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
    REPORT_TARGET_TYPES,
    REPORT_TARGET_TYPE_USER,
    REPORT_TARGET_TYPE_POST,
    REPORT_TARGET_TYPE_FORUM,
    REPORT_TARGET_TYPE_THREAD,
    REPORT_TARGET_TYPE_COMMENT,
    REPORT_TARGET_TYPE_MESSAGE,
    REPORT_STATUSES,
    REPORT_STATUS_SUBMITTED,
    REPORT_STATUS_SUCCESS,
    REPORT_STATUS_FAILED,
    REPORT_REASONS,
    REPORT_MESSAGE_SUBMITTED
}