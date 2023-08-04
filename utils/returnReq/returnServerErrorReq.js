// return 500 error

module.exports = function returnServerErrorReq(res) {
    res.status(500).json({ message: 'Internal server error' });
}