// controller function to register a new user

const User = require('../../models/user.js');
const { setJWT } = require('../../utils/users/setJWT.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { passwordRequirements } = require('../../utils/users/passwordValidation.js');

// register new user
const registerUser = async (req, res) => {
    // return 400 error if no data is sent
    if (!req.body) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const { emailAddress, phoneNumber, password } = req.body;

    // validate phone number
    if (phoneNumber.length != 8){
        // TO DO: ADD FIREBASE AUTH 
        return res.status(400).json({ error: 'Inavlid phone number' });
    }

    // validate password complexity requirements
    if (passwordRequirements(password) in ['very-weak', 'weak']){
        return res.status(400).json({ error: 'Password does not meet complexity requirements' });
    }

    try {
        const newUser = new User({
            username: 'user' + crypto.randomBytes(4).toString("hex"),
            email: emailAddress,
            phone_number: phoneNumber,
            password: await bcrypt.hash(password, 10),
        });

        // Save user into database
        await newUser.save();
        
        // sign jwt and return as cookie
        setJWT(newUser._id, res);
        
        res.status(200).end();

    }
    catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phone_number) {
            // Duplicate phone number error
            res.status(400).json({ error: 'Phone number already exists' });
        } else if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            // Duplicate email error
            res.status(400).json({ error: 'Email already exists' });
        } 
        else {
            // Other error
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = {
    registerUser
}