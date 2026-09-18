# MYXTRAS Backend

MYXTRAS is a polytechnic capstone social platform with user profiles, posts,
forums, discussion threads, chat, reporting/moderation, events, and
gamification. This repository contains the Node.js backend; the companion Vue
frontend is [MYXTRAS-Frontend](https://github.com/keefecheong/MYXTRAS-Frontend).

This is a historical capstone artifact and is not actively maintained or
deployed. The repository is preserved as a clear, reproducible record of the
implemented project.

## Stack

- Node.js 18 and Express
- MongoDB with Mongoose (MongoDB 6.0 is the historical reproduction baseline)
- Redis Stack/RedisJSON for cache projections
- Socket.IO for chat and presence
- Multer for in-memory image uploads
- External media and moderation adapters (bring your own compatible endpoints)

## Local setup

Prerequisites: Node.js 18, MongoDB 6.0 or a compatible MongoDB connection,
Docker with Redis Stack, and Git.

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Start Redis Stack:

   ```sh
   docker run --rm --name myxtras-redis \
     -v "$(pwd)/cache/redis.conf:/redis-stack.conf" \
     -p 6379:6379 redis/redis-stack:latest
   ```

3. Copy `env_template` to `.env` and replace the placeholders. Use
   `127.0.0.1` consistently for the frontend and backend origins so browser
   cookies work as expected.

4. Start the development server:

   ```sh
   npm run dev
   ```

The API is served from `http://127.0.0.1:<PORT>` and all HTTP routes are under
`/api`. Configure the frontend's `APP_SERVER_URL` to the same backend origin.

The original Sightengine and AWS media services are retired. Moderation and
media-upload flows require users to provide compatible endpoints and credentials
through the environment variables documented in
[the setup audit](docs/setup-audit.md).

## Commands

```sh
npm run dev                 # development server with nodemon
npm run lint               # JavaScript and filename checks
npm test -- <test-file>    # one Mocha integration suite
npm run test:integration   # suites used by the historical CI workflow
```

Tests use MongoDB Memory Server and require a running Redis Stack instance.
They are integration checks for the existing feature flows, not a production
readiness or coverage guarantee.

## Documentation

- [Architecture and technical decisions](docs/architecture.md)
- [Codebase index](docs/codebase-index.md)
- [HTTP and Socket.IO interface](docs/api-reference.md)
- [Setup and verification audit](docs/setup-audit.md)
- [Presentation polish implementation plan](docs/implementation-plan.md)

The original baseline is `main` commit `2454ca71053af2aeff18c1cc71eb53da0872a1ae`.
