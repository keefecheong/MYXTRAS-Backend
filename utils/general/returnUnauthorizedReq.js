// to return 401 error

module.exports = function returnUnauthorizedReq(res) {
    res.status(401).json({ message: 'Unauthorized' });
}