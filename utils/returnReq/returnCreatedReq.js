// return 201 response with no body

module.exports = function returnCreatedReq(res) {
    res.status(201).end();
}