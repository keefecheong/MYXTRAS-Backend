// function to sign jwt token and set in response

const jwt = require('jsonwebtoken');

function setJWT(userId, res) {
    // Signs JWT token to be stored in HTTP cookie
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);

    // set secure: true and sameSite: 'none' only in production mode
    if (process.env.NODE_ENV === 'production') {
        res.cookie("authapi", accessToken, {
            expires: new Date(
                Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            sameSite: 'none',
            secure: true
        });
    }
    else {
        res.cookie("authapi", accessToken, {
            expires: new Date(
                Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        });
    }
}

module.exports = {
    setJWT
}