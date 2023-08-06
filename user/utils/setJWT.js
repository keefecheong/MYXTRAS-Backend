// function to sign jwt token and set in response

const jwt = require('jsonwebtoken');
const JWT_COOKIE_KEY = 'authapi';

// get jwt and set as cookie in res
function setJWT(userId, res) {
    const accessToken = generateJWT(userId);

    // set secure: true and sameSite: 'none' only in production mode
    if (process.env.NODE_ENV === 'production') {
        res.cookie(JWT_COOKIE_KEY, accessToken, {
            expires: new Date(
                Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            sameSite: 'none',
            secure: true
        });
    }
    else {
        res.cookie(JWT_COOKIE_KEY, accessToken, {
            expires: new Date(
                Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        });
    }
}

// craft jwt token
function generateJWT(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET);
}

module.exports = {
    setJWT,
    generateJWT,
    JWT_COOKIE_KEY
}