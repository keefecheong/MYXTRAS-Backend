// controller functions to verify email and phone number during registration

const User = require('../../models/user.js');

// check if email exists
const verifyEmail = async (req, res) => {
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({ error: 'Invalid request body.' });
    }
    
    const existingEmail = await User.findOne({ email: email });

    if (existingEmail) {
        res.status(400).json({ error: 'Email already exists' });
    }
    else {
        res.status(200).end();
    }
}

// check if phone number exists
const verifyPhoneNum = async (req, res) => {
    const phoneNumber = req.body.phoneNumber;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Invalid request body.' });
    }

    const existingPhone = await User.findOne({ phone_number: phoneNumber });

    if (existingPhone) {
        res.status(400).json({ error: 'Phone Number already exists' });
    }
    else {
        res.status(200).end();
    }
}

// check if phone number exists
const verifyUsername = async (req, res) => {
    const username = req.body.username;

    if (!username) {
        return res.status(400).json({ error: 'Invalid request body.' });
    }

    const existingUsername = await User.findOne({ username: username });

    if (existingUsername) {
        res.status(400).json({ error: 'Username already exists' });
    }
    else {
        res.status(200).end();
    }
}

module.exports = {
    verifyEmail,
    verifyPhoneNum,
    verifyUsername
}