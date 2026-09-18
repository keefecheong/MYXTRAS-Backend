# Codebase index

## Snapshot

| Item | Value |
| --- | --- |
| Baseline | `main` at `2454ca71053af2aeff18c1cc71eb53da0872a1ae` |
| Tracked files | 241 |
| JavaScript files | 161 |
| JavaScript lines | approximately 16,100 |
| Runtime style | Node.js CommonJS |
| Primary entry point | `server.js` |
| Route composition root | `routes/mountRoutes.js` |
| Companion client | <https://github.com/keefecheong/MYXTRAS-Frontend> |

## Root and project configuration

| Path | Purpose |
| --- | --- |
| `server.js` | process entry point; middleware, infrastructure startup, HTTP server, and Socket.IO |
| `package.json` / `package-lock.json` | dependency lock and development commands |
| `env_template` | environment-variable example; currently contains values that must be sanitized |
| `README.md` | minimal existing project introduction and setup note |
| `test.rest` | manual HTTP request examples |
| `.github/workflows/` | push-time lint and integration-test workflows |
| `.eslintrc.yml` | ESLint configuration; currently declares a browser/ES module environment although the backend is Node/CommonJS |
| `.editorconfig`, `.ls-lint.yml`, `.stylelintrc.yml` | formatting, naming, and style configuration |
| `.gitignore` | ignores dependencies, environment files, build output, logs, and editor state |

## Application directories

The domain folders generally follow the same internal convention:
`routes/` compose endpoints, `controllers/` implement request behavior,
`models/` define Mongoose records, `middleware/` loads route resources,
`cache/` updates Redis projections, `utils/` contains domain operations, and
`test/` contains integration helpers or suites.

| Directory | Contents and ownership |
| --- | --- |
| `admin/` | administrator account promotion/demotion, suspension/termination, report review/resolution, and Sightengine moderation |
| `cache/` | Redis client, Redis Stack configuration, and global Mongoose cache-aside interception |
| `chat/` | chats/messages, REST history queries, `/chatSocket` event handling, presence, typing, file transfer, and chat test data |
| `comment/` | shared post/thread comment model, CRUD logic, parent count maintenance, and cache operations |
| `event/` | event model and authenticated listing plus admin-only mutation routes |
| `forum/` | forum lifecycle, discovery categories/recommendations, subscriptions, cache behavior, and deletion tests |
| `gamification/` | missions, daily check-in, gems, gachapon, pets, static configuration, and midnight reset scheduling |
| `middleware/` | shared JWT authentication and memory-backed Multer upload validation |
| `mongoDB/` | MongoDB or in-memory test database initialization and default account seeding |
| `post/` | feeds, post lifecycle, likes, saves, post comments, cache projections, and integration tests |
| `report/` | report creation, user/admin queries, warning acknowledgement, target-specific aggregation, and resolution |
| `routes/` | mounts the eleven top-level HTTP route groups |
| `school/` | unauthenticated endpoint backed by static `schools.json` data |
| `search/` | authenticated user, forum, and combined search |
| `sockets/` | attaches Socket.IO to the HTTP server |
| `thread/` | forum thread lifecycle, likes/dislikes, comments, aggregation, caching, and integration tests |
| `user/` | accounts, profiles, JWTs, relationships, blocking, status, warnings, cache projections, and integration tests |
| `utils/` | cross-domain async/ID/time helpers, response helpers, S3 facade calls, and shared test utilities |

## Principal models

| Model | Key fields and relationships |
| --- | --- |
| `User` | identity/profile, followers, blocked users, admin flag, password, gamification state, warnings, and account status |
| `Unblock` | blocker/blocked pair and delayed unblock time |
| `Post` | creator, media links/names, caption/location/tags, likes, saves, and comment count |
| `Forum` | creator, public forum ID, image/banner, tags, and subscribers |
| `Thread` | forum and creator references, title/content/media, comment count, likes/dislikes, and tags |
| `Comment` | creator, immutable content, and polymorphic post/thread parent |
| `Chat` | participating users and last-message timestamp |
| `Message` | creator, chat, text or attachment, timestamps, and optional replied-to message |
| `Report` | polymorphic target, owner, reporter, evidence/reason, review status, reviewer, and target-specific metadata |
| `Event` | banner, name, description, date, location, and display color |

## Cross-cutting entry points

- `middleware/authMiddleware.js`: HTTP and socket JWT validation.
- `middleware/multerMiddleware.js`: accepted image type, size, and count rules.
- `cache/init.js`: opt-in `.cache()` API and model-specific cache dispatch.
- `utils/returnReq/`: shared 200/201/204/400/401/403/404/500 responses.
- `utils/s3/`: upload/delete calls to the configured media facade.
- `gamification/utils/init.js`: scheduled mission reset loaded as a startup side
  effect.
- `mongoDB/seedUsers.js`: non-test startup seeding.

## Dependency/reachability review

A static scan of relative `require()` calls found no unreferenced production
JavaScript module. The only zero-inbound files are the five intended Mocha suite
entry points:

- `admin/test/userTerminateTest.js`
- `forum/test/forumDeleteTest.js`
- `post/test/postDeleteTest.js`
- `thread/test/threadDeleteTest.js`
- `user/test/userBlockTest.js`

This does not prove every exported function is used, but it means file deletion
should be conservative. Dead-code cleanup should begin with lint-confirmed
unused imports, stale commented code, misleading comments, and manual artifacts
rather than removing whole modules based on naming alone.

