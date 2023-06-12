// controller functions to handle user login

const User = require('../../models/user.js');
const { setJWT } = require('../../utils/users/setJWT.js');
const bcrypt = require('bcryptjs');

// login user
const loginUser = async (req, res) => {
    // return 400 error if no data is sent
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    
    const { emailAddress, password } = req.body;
    
    try {
        // Find the user by email
        const user = await User.findOne({ email: emailAddress });
        
        // User not found
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Check if the password is correct
        if (!bcrypt.compareSync(password, user.password)){
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    
        // sign jwt and return as cookie
        setJWT(user._id, res);

        // Authentication successful
        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    loginUser
}