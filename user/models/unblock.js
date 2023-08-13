const mongoose = require("mongoose");

const UNBLOCK_TTL = 30; // ttl for unblock in minutes

const unblockSchema = new mongoose.Schema({
  blocker_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  blocked_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  unblock_time: {
    type: Date,
    default: function () {
      return Date.now();
    },
    immutable: true,
  },
});

// delete documents after 30 minutes since creation
unblockSchema.index(
  { unblock_time: 1 },
  { expireAfterSeconds: UNBLOCK_TTL * 60 },
);

module.exports = {
  Unblock: mongoose.model("Unblock", unblockSchema),
  UNBLOCK_TTL,
};
