/cache:
Contains files with functions for cache implementation

Start Redis server with Docker (need to install Docker):
docker run -v "$(pwd)/cache/redis.conf:/redis-stack.conf" -p 6379:6379 redis/redis-stack:latest