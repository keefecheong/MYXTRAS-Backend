// common functions to check user socket connection status

function getUserConnectionIndex(connections, targetUserId) {
  return connections.findIndex(
    (connection) => connection.userId == targetUserId,
  );
}

// only return true if the target user is online
// if checkBlock is true, only return true if both users are not blocking each other
function getUserOnline(connections, targetUserId, checkBlock, user) {
  if (checkBlock) {
    const targetNotBlocked = !user.blocked_users.includes(targetUserId);
    const targetOnline = connections.some(
      (connection) =>
        connection.userId == targetUserId &&
        !connection.blockedUsers.includes(user._id.toString()),
    );

    return targetNotBlocked && targetOnline;
  }

  return connections.some((connection) => connection.userId == targetUserId);
}

module.exports = {
  getUserConnectionIndex,
  getUserOnline,
};
