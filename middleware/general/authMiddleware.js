// middleware to make sure user is authenticated

const { User, USER_TERMINATED_MSG, USER_SUSPENDED_MSG } = require('../../models/user.js');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const returnForbiddenReq = require('../../utils/general/returnForbiddenReq.js');

const { getUserKey } = require('../../cache/users/userCache.js');
const suspendUser = require('../../utils/report/suspendUser.js');
const acknowledgeWarning = require('../../utils/report/acknowledgeWarning.js');

const clearJWTCookie = require('../../utils/general/clearJWTCookie.js');
const { JWT_COOKIE_KEY } = require('../../utils/users/setJWT.js');

// make sure jwt is valid and user is authenticated
// for http requests
async function validateUserHTTP(req, res, next, checkAdmin = false) {
    try {
        // Get the JWT token from the cookie
        const token = req.cookies[JWT_COOKIE_KEY];

        // return 401 error if there is no authapi cookie
        if (!token) {
            return returnUnauthorizedReq(res);
        }

        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // get user based on id in jwt token
        const userId = decodedToken.id;
        const user = await User.findById(userId).lean().cache({
            key: getUserKey(userId)
        });

        // return 401 error if user not found or user is not admin (if admin check required)
        if (!user || (checkAdmin && !user.is_admin)) {
            return returnUnauthorizedReq(res);
        }

        // remove suspend if end_time is reached
        const checkUserStatus = await suspendUser(false, user);

        // if accessGranted is false means user is terminated or suspended
        // clear jwt cookie and return 403
        if (!checkUserStatus.accessGranted) {
            const message = checkUserStatus.terminated ? USER_TERMINATED_MSG : USER_SUSPENDED_MSG;

            clearJWTCookie(res);
            return returnForbiddenReq(res, message);
        }

        // update user if suspend status is removed
        if (checkUserStatus.updated) {
            user.status = {};
        }

        // Attach the user object to the request for further processing
        req.user = user;

        // acknowledge warnings
        acknowledgeWarning(user);

        next();
    }
    // Handle token verification or database errors
    catch (error) {
        returnServerErrorReq(res);
    }
}

// for socket requests
async function validateUserSocket(socket, next) {
    try {
        // Get the JWT token from the cookie
        const cookies = socket.request.headers.cookie || null;
        
        // disconnect socket if there is no cookie
        if (!cookies) {
            socket.disconnect(true);
            socket.emit('unauthorized', { message: 'Unauthorized' });
            return;
        }

        // disconnect socket if there is no authapi cookie
        const token = cookie.parse(cookies.toString())[JWT_COOKIE_KEY];
        if (!token) {
            socket.disconnect(true);
            socket.emit('unauthorized', { message: 'Unauthorized' });
            return;
        }

        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // get user based on id in jwt token
        const userId = decodedToken.id;
        const user = await User.findById(userId).lean().cache({
            key: getUserKey(userId)
        });

        // disconnect socket if user not found
        if (!user) {
            socket.disconnect(true);
            socket.emit('unauthorized', { message: 'Unauthorized' });
            return;
        }

        // attach the user information to the socket for use
        // get username and profile_pic_link to store in socket
        // store blocked_user's user ids also
        socket.user = {
            _id: user._id,
            username: user.username,
            profile_pic_link: user.profile_pic_link,
            blocked_users: user.blocked_users.map(entry =>  entry.user_id.toString()),
            daily_missions: user.daily_missions
        };

        next();
    }
    // Handle token verification or database errors
    catch (error) {
        socket.disconnect(true);
        socket.emit('server-error', { message: 'Internal Server Error' });
        return;
    }
}

module.exports = {
    validateUserHTTP,
    validateUserSocket
}