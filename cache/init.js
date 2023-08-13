// setup caching

const redisClient = require("./redis.js");

const mongoose = require("mongoose");

const { getUserFromCache, cacheUser } = require("../user/cache/userCache.js");
const { cachePosts, getPostsFromCache } = require("../post/cache/postCache.js");
const {
  cacheComments,
  getCommentsFromCache,
} = require("../comment/cache/commentCache.js");
const {
  cacheForums,
  getForumFromCache,
} = require("../forum/cache/forumCache.js");
const {
  cacheThreads,
  getThreadsFromCache,
} = require("../thread/cache/threadCache.js");
const { cacheUnblock } = require("../user/cache/unblockCache.js");

// save exec for use later
const exec = mongoose.Query.prototype.exec;
const aggExec = mongoose.Aggregate.prototype.exec;

// set cache function to specify use of cache
mongoose.Query.prototype.cache = function (options = {}) {
  return enableCaching(this, options);
};

mongoose.Aggregate.prototype.cache = function (options = {}) {
  return enableCaching(this, options);
};

// override exec function for custom caching implementation (for queries)
mongoose.Query.prototype.exec = async function () {
  // if not using cache then execute the query and return the results
  if (!this.enableCache || !redisClient.isReady) {
    return exec.apply(this, arguments);
  }

  const modelName = this.mongooseCollection.modelName;

  const cacheKey = this.cacheOptions.key;
  const cachePath = this.cacheOptions.path;
  const userPopulateFollowers = this.cacheOptions.populateFollowers;

  let data;

  switch (modelName) {
    case "User":
      data = await getUserFromCache(cacheKey, userPopulateFollowers);
      break;

    case "Post":
      data = await getPostsFromCache(cacheKey);
      break;

    case "Forum":
      data = await getForumFromCache(cacheKey);
      break;

    case "Thread":
      data = await getThreadsFromCache(cacheKey);
      break;

    case "Comment":
      data = await getCommentsFromCache(cacheKey);
      break;

    default:
      data = await getFromCache(cacheKey, cachePath);
      break;
  }

  if (!data) {
    // if cache entry does not exist then execute the query and store data in cache
    data = await exec.apply(this, arguments);

    // apply corresponding functions based on model queried
    switch (modelName) {
      case "User":
        await cacheUser(data, cacheKey, userPopulateFollowers);
        break;

      case "Post":
        await cachePosts(data, cacheKey);
        break;

      case "Forum":
        await cacheForums(data, cacheKey);
        break;

      case "Thread":
        await cacheThreads(data, cacheKey, this.cacheOptions.type);
        break;

      case "Comment":
        await cacheComments(data, cacheKey);
        break;

      case "Unblock":
        await cacheUnblock(data, cacheKey);
        break;

      default:
        break;
    }
  }

  return data;
};

// override exec function for custom caching implementation (for aggregation)
mongoose.Aggregate.prototype.exec = async function () {
  // if not using cache then execute the query
  if (!this.enableCache || !redisClient.isReady) {
    return aggExec.apply(this, arguments);
  }

  if (this.enableCache) {
    const cacheKey = this.cacheOptions.key;

    // if using cache check if data exists in cache
    let data = await getFromCache(cacheKey);

    if (!data) {
      // if cache entry does not exist then execute the query and store data in cache
      data = await aggExec.apply(this, arguments);

      // apply corresponding functions based on model queried
      switch (this._model.modelName) {
        case "Post":
          await cachePosts(data, cacheKey);
          break;

        case "Forum":
          await cacheForums(data, cacheKey);
          break;

        case "Thread":
          await cacheThreads(data, cacheKey);
          break;

        default:
          break;
      }
    }

    return data;
  }
};

// function to add fields to specify use of cache
function enableCaching(context, cacheOptions) {
  context.enableCache = true;

  // set default key as the model name if not provided
  if (!cacheOptions.key) {
    cacheOptions.key =
      context.mongooseCollection.modelName || context._model.modelName;
  }

  context.cacheOptions = cacheOptions;

  return context;
}

// function to get data from cache
function getFromCache(key, path) {
  const options = {};

  // set path if provided
  if (path) {
    options.path = path;
  }

  return redisClient.json.get(key, options);
}
