const mongoose = require("mongoose");

// to update parent object's comment_count
module.exports = function updateParentCommentCount(
  parentModel,
  parentId,
  toIncrease,
  asJSON,
  count = 1,
) {
  const filter = {
    _id: parentId,
  };

  const update = {
    $inc: { comment_count: toIncrease ? count : -count },
  };

  return asJSON
    ? { updateOne: { filter, update } }
    : mongoose.model(parentModel).updateOne(filter, update);
};
