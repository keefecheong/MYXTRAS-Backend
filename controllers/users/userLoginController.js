// controller functions to handle user login

const { User } = require('../../models/user.js');
const { setJWT } = require('../../utils/users/setJWT.js');
const bcrypt = require('bcryptjs');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

// login user
async function loginUser(req, res) {
    // return 400 error if no data is sent
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }
    
    const { emailAddress, password } = req.body;
    
    try {
        // Find the user by email
        const user = await User.findOne({ email: emailAddress }).select('email password is_profile_setup');
        
        // User not found
        if (!user) {
            return returnBadReq(res, 'Invalid email or password');
        }
        
        // Check if the password is correct
        if (!bcrypt.compareSync(password, user.password)){
            return returnBadReq(res, 'Invalid email or password');
        }
        
        // sign jwt and return as cookie
        setJWT(user._id, res);

        // Authentication successful
        returnGoodReq(res, { message: 'Login successful', is_profile_setup: user.is_profile_setup });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    loginUser
}