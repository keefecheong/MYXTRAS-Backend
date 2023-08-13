// recieves an array of promises/single promise and executes them, return true if succeeded and false otherwise
module.exports = async function returnPromiseResult(promises) {
  let result;

  if (Array.isArray(promises)) {
    result = promises.length > 1 ? Promise.all(promises) : promises[0];
  } else {
    result = promises;
  }

  return await result
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};
