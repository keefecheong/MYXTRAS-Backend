const { validateUserSocket } = require('../../middleware/general/authMiddleware.js');

// store user connection information
const connections = []

// socket.io event handler for chats
function chatHandler(io) {
    const chatNamespace = io.of('/chat');

    // check if user is authenticated
    chatNamespace.on('connection', validateUserSocket, (socket) => {
        // manage user connection information
        const userConnectionIndex = connections.findIndex(connection => connection.userId == socket.user._id);

        // if user does not have an existing socket then add the user id and socket id to connections
        if (userConnectionIndex == -1) {
            connections.push({
                userId: socket.user._id,
                socketId: [socket.id]
            });
        }
        // otherwise add the new socket id to the existing connection object
        else {
            connections[userConnectionIndex].socketId.push(socket.id);
        }

        // handle user disconnect
        socket.on('disconnect', );

        // handle new message
        socket.on('new-message', );

        // get user's presence (online/offline)
        socket.on('query-user-presence', );

        // handle typing status
        socket.on('user-typing', );

        // handle new chat
        socket.on('new-chat', );
    });
}

module.exports = {
    chatHandler
}