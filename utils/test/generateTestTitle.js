// to generate test title
module.exports = function generateTestTitle(
  actionPerformed,
  object,
  forDatabase,
  describe = "contain",
) {
  return `should ${actionPerformed ? "not " : ""}${describe} ${object} in ${
    forDatabase ? "database" : "cache"
  }`;
};
