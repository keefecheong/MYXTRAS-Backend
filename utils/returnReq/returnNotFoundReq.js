// return 404 error

module.exports = function returnNotFoundReq(res) {
  res.status(404).json({ message: "Not found." });
};
