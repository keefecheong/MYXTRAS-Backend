// return 403 response

module.exports = function returnForbiddenReq(res, message) {
  res.status(403).json({ message });
};
