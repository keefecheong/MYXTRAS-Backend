// setup caching

const redisClient = require('./redis.js');

const mongoose = require('mongoose');

const { getUserFromCache, cacheUser } = require('./users/userCache.js');
const { cachePosts } = require('./posts/postCache.js');
const { cacheComments } = require('./comments/commentCache.js');
const { cacheForums } = require('./forums/forumCache.js');
const { cacheThreads } = require('./threads/threadCache.js');

// save exec for use later
const exec = mongoose.Query.prototype.exec;
const aggExec = mongoose.Aggregate.prototype.exec;

// set cache function to specify use of cache
mongoose.Query.prototype.cache = function(options = {}) {
    return enableCaching(this, options);
}

mongoose.Aggregate.prototype.cache = function(options = {}) {
    return enableCaching(this, options);
}

// override exec function for custom caching implementation (for queries)
mongoose.Query.prototype.exec = async function() {
    // if not using cache then execute the query and return the results
    if (!this.enableCache) {
        return exec.apply(this, arguments);
    }

    const modelName = this.mongooseCollection.modelName;

    const cacheKey = this.cacheOptions.key;
    const cachePath = this.cacheOptions.path;
    const userPopulateFollowers = this.cacheOptions.populateFollowers;

    // if using cache check if data exists in cache
    let data = await (
        (modelName == 'User' && userPopulateFollowers) 
        ? getUserFromCache(cacheKey, true) 
        : getFromCache(cacheKey, cachePath)
    );

    if (!data) {
        // if cache entry does not exist then execute the query and store data in cache
        data = await exec.apply(this, arguments);

        // apply corresponding functions based on model queried
        switch (modelName) {
            case 'User':
                await cacheUser(data, cacheKey, userPopulateFollowers);
                break;

            case 'Post':
                await cachePosts(data, cacheKey);
                break;

            case 'Forum':
                await cacheForums(data, cacheKey);
                break;

            case 'Thread':
                await cacheThreads(data, cacheKey, this.cacheOptions.type);
                break;

            case 'Comment':
                await cacheComments(data, cacheKey);
                break;

            default:
                break;
        }
    }

    return data;
}

// override exec function for custom caching implementation (for aggregation)
mongoose.Aggregate.prototype.exec = async function() {
    // if not using cache then execute the query
    if (!this.enableCache) {
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
                case 'Post':
                    await cachePosts(data, cacheKey);
                    break;

                case 'Forum':
                    await cacheForums(data, cacheKey);
                    break;

                case 'Thread':
                    await cacheThreads(data, cacheKey);
                    break;

                default:
                    break;
            }
        }

        return data;
    }
}

// function to add fields to specify use of cache
function enableCaching(context, cacheOptions) {
    context.enableCache = true;

    // set default key as the model name if not provided
    if (!cacheOptions.key) {
        cacheOptions.key = context.mongooseCollection.modelName || context._model.modelName;
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