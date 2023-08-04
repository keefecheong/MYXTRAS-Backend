// controller function to register a new user

const { User } = require('../models/user.js');
const { setJWT } = require('../utils/setJWT.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { passwordRequirements } = require('../utils/passwordValidation.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnBadReq = require('../../utils/returnReq/returnBadReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

const { cacheNewUser } = require('../cache/userUpdateCache.js');

const saveDocAsync = require('../../utils/general/saveDocAsync.js');

// register new user
async function registerUser(req, res) {
    // return 400 error if no data is sent
    if (!req.body) {
        return returnBadReq(req, 'Invalid request body');
    }

    const { emailAddress, phoneNumber, password } = req.body;

    // validate phone number
    if (phoneNumber.length != 8){
        return returnBadReq(res, 'Inavlid phone number');
    }

    // validate password complexity requirements
    if (passwordRequirements(password) in ['very-weak', 'weak']){
        return returnBadReq(res, 'Password does not meet complexity requirements');
    }

    try {
        const newUser = new User({
            username: 'user' + crypto.randomBytes(4).toString("hex"),
            email: emailAddress,
            phone_number: phoneNumber,
            password: await bcrypt.hash(password, 10),
        });

        // Save user into cache and database
        await Promise.all([
            cacheNewUser(newUser),
            saveDocAsync(newUser, false)
        ]);
        
        // sign jwt and return as cookie
        setJWT(newUser._id, res);
        
        returnGoodReq(res);
    }
    catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phone_number) {
            // Duplicate phone number error
            returnBadReq(res, 'Phone number already exists');
        } else if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            // Duplicate email error
            returnBadReq(res, 'Email already exists');
        } 
        else {
            // Other error
            returnServerErrorReq(res);
        }
    }
}

module.exports = {
    registerUser
}