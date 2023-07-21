const terminateUser = require('./terminateUser.js')

module.exports = function test(req, res) {
    try{
        terminateUser('649fda3cb56cc7cbad70d276')
        res.status(200).end()
    }
    catch (error) {
        console.log(error)
        res.status(500).end();
    }
}