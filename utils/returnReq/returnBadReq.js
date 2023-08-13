// to return 400 error

module.exports = function returnBadReq(res, message) {
  res.status(400).json({ message });
};
