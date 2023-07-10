/cache:
Contains Dockerfile to start Redis server and files with cache functions

Start Redis server with Docker (need to install Docker):
docker run -v "$(pwd)/cache/redis.conf:/redis-stack.conf" -p 6379:6379 redis/redis-stack:latest