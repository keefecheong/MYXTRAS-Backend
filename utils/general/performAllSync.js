// to update cache and database synchronously
module.exports = async function performAllSync(cachePromises, dbPromise) {
  // add update db promise to array and execute all if the array is not empty (cache updated)
  if (cachePromises.length > 0) {
    if (dbPromise.length > 0) {
      cachePromises = cachePromises.concat(dbPromise);
    } else {
      cachePromises.push(dbPromise);
    }

    await Promise.all(cachePromises);
  }
  // otherwise execute db promise on its own
  else {
    if (dbPromise.length > 0) {
      await Promise.all(dbPromise);
    } else {
      await dbPromise;
    }
  }
};
