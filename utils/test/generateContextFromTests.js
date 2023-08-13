// to return a Mocha Suite object crafted from an array of tests as json objects

const Mocha = require("mocha");

module.exports = function generateContextFromTest(
  actionPerformed,
  action,
  tests,
  specificTitle,
) {
  const context = new Mocha.Suite(
    specificTitle || `${actionPerformed ? "after" : "before"} ${action}`,
  );
  context.tests = tests.map((entry) =>
    it(entry.title, async () => await entry.callback(...entry.params)),
  );

  return context;
};
