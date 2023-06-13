// middleware to make sure user is authenticated

const User = require('../../models/user.js');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

// make sure jwt is valid and user is authenticated
// for http requests
async function validateUserHTTP(req, res, next) {
    try {
        // Get the JWT token from the cookie
        const token = req.cookies.authapi;

        // return 401 error if there is no authapi cookie
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // get user based on id in jwt token
        const userId = decodedToken.id;
        const user = await User.findById(userId);

        // return 401 error if user not found
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Attach the user object to the request for further processing
        req.user = user;

        next();
    }
    // Handle token verification or database errors
    catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

// for socket requests
async function validateUserSocket(socket, next) {
    try {
        // Get the JWT token from the cookie
        const token = cookie.parse(socket.request.headers.cookie).authapi;

        // disconnect socket if there is no authapi cookie
        if (!token) {
            socket.disconnect(true);
            socket.emit('unauthorized', { message: 'Unauthorized' });
        }

        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // get user based on id in jwt token
        // get username and profile_pic_link to store in socket
        const userId = decodedToken.id;
        const user = await User.findById(userId).select('username profile_pic_link');

        // disconnect socket if user not found
        if (!user) {
            socket.disconnect(true);
            socket.emit('unauthorized', { message: 'Unauthorized' });
        }

        // attach the user information to the socket for use
        socket.user = user;

        next();
    }
    // Handle token verification or database errors
    catch (error) {
        console.log(error)
        socket.disconnect(true);
        socket.emit('server-error', { message: 'Internal Server Error' });
    }
}

module.exports = {
    validateUserHTTP,
    validateUserSocket
}