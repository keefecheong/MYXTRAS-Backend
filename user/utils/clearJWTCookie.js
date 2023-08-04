const { JWT_COOKIE_KEY } = require('./setJWT.js');

// to clear jwt cookie
module.exports = function clearJWTCookie(res) {
    res.clearCookie(JWT_COOKIE_KEY);
}