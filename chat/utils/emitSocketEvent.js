// to emit socket event given various fields

function emitSocketEvent(socket, room, event, data) {
    // map 'self' value for room to the user in the socket
    if (room == 'self') {
        room = socket.user._id.toString();
    }

    // don't broadcast to blocked users
    socket.to(room).except(socket.user.blockedUsers).emit(event, data);
}

module.exports = {
    emitSocketEvent
}