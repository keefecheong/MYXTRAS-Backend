const express = require('express');
const User = require('../models/user');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

app.use(bodyParser.json());

// Register
router.get('/', (req, res) => {
    res.send('hello')
})
// Set up profile
router.get('/:id', (req, res) => {
   
})

// Creating one
router.post('/', express.json(), async (req, res) => {
    
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    const { emailAddress, phoneNumber, password } = req.body;
    console.log(emailAddress)
    // check if user already exists in database
   
    try {
        console.log("2")
        const newUser = new User({
            email: emailAddress,
            phonenumber: phoneNumber,
            password: await bcrypt.hash(password, 10),
        });
        console.log(newUser)
        // Save user into database
        await newUser.save();
        console.log("1")
        res.status(200).json({ message: 'User created.' });

        //  // send verification email
        // const verificationUrl = `http://localhost:3000/api/users/verify/${newUser.activeToken}`;
        // const mailOptions = {
        //     to: email,
        //     subject: 'Verify your email address',
        //     html: `Please click this link to verify your email address: <a href="${verificationUrl}">${verificationUrl}</a>`,
        // };

        // // send verification email using NodeMailer or a similar email service



    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

router.patch('/', (req, res) => {

})  

module.exports = router;