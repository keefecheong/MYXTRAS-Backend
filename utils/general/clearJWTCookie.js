const { JWT_COOKIE_KEY } = require("../users/setJWT");

// to clear jwt cookie
module.exports = function clearJWTCookie(res) {
    res.clearCookie(JWT_COOKIE_KEY);
}