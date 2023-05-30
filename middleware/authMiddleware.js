// middleware to make sure user is authenticated

const User = require('../models/user.js');
const jwt = require('jsonwebtoken');

// make sure jwt is valid and user is authenticated
async function validateUser(req, res, next) {
    try {
        // Get the JWT token from the cookie
        const token = req.cookies.authapi;

        // return 401 error if there is no authapi cookie
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized.' });
        }
        
        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // get user based on id in jwt token
        const userId = decodedToken.id;
        const user = await User.findById(userId);

        // return 404 error if user not found
        if (!user) {
          return res.status(404).json({ message: 'Invalid user.' });
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

module.exports = {
    validateUser
}