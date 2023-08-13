// return 200 response with specified body or default empty object

module.exports = function returnGoodReq(res, body = {}) {
  res.status(200).json(body);
};
