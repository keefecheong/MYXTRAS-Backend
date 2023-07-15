// set up socket event handlers for chat socket

// get middleware
const { validateUserSocket } = require('../../middleware/general/authMiddleware.js');

// get controller functions
const { handleNewConnection, handleDisconnection } = require('../../controllers/chats/chatSocketConnectionController.js');
const { handleSendMessage, handleEditMessage, handleDeleteMessage,  } = require('../../controllers/chats/chatSocketMessageController.js');
const { handleUserTyping, handleQueryUserPresence } = require('../../controllers/chats/chatSocketStatusController.js');

// store user connection information
const connections = [];

// socket.io event handler for chats
function chatHandler(io) {
    // create namespace for chats
    const chatNamespace = io.of('/chatSocket');

    // check if user is authenticated
    chatNamespace.use((socket, next) => {
        // pass to validateUserSocket middleware only if it is the first connection for the socket
        const existingConnection = connections.some((connection) => {
            connection.socketId.indexOf(socket.id) != -1;
        });

        if (!existingConnection) {
            validateUserSocket(socket, next);
        }
    });

    chatNamespace.on('connection', (socket) => {
        // handle new connection
        handleNewConnection(socket, connections);

        // handle user disconnect
        socket.on('disconnect', () => handleDisconnection(socket, connections));

        // handle incoming messages (sent by user)
        socket.on('send-message', (data) => handleSendMessage(data, socket, connections));

        // handle edit message
        socket.on('edit-message', (data) => handleEditMessage(data, socket, connections));

        // handle delete message
        socket.on('delete-message', (data) => handleDeleteMessage(data, socket, connections));

        // get user's presence (online/offline)
        socket.on('query-user-presence', (data, callback) => handleQueryUserPresence(data, callback, socket, connections));

        // handle typing status updates
        socket.on('user-typing', (data) => handleUserTyping(data, socket));
    });
}

module.exports = {
    chatHandler
}