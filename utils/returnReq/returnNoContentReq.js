// return 204 response with no body

module.exports = function returnNoContentReq(res) {
    res.status(204).end();
}