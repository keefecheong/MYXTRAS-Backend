# Setup and verification audit

## Intended local topology

The code expects four parts:

1. this Node.js backend;
2. the Vue frontend at <https://github.com/keefecheong/MYXTRAS-Frontend>;
3. MongoDB (except tests, which use MongoDB Memory Server); and
4. Redis Stack with RedisJSON, commonly started through Docker.

Full-feature execution also needs user-supplied Sightengine credentials and a
compatible AWS S3 Lambda facade used for media upload and deletion. The
original project integrations are no longer available; the integration points
remain configurable for anyone who wants to provide replacements.

## Confirmed historical baseline

| Component | Baseline for the presentation revision |
| --- | --- |
| Node.js | Node 18 |
| MongoDB | MongoDB 6.0, preferably the latest patch in the 6.0 release line |
| Redis | Redis Stack with RedisJSON |

MongoDB 6.0 is the appropriate historical compatibility target: it was the
current on-premises major release in July 2023, before MongoDB 7.0 was released
in August 2023. MongoDB 6.0 is now end-of-life, so the README should describe it
as a reproduction baseline rather than recommend it for a new production
system. This timing is confirmed by MongoDB's
[official lifecycle schedule](https://www.mongodb.com/legal/support-policy/lifecycles)
and [MongoDB 7.0 release notes](https://www.mongodb.com/docs/v7.0/release-notes/7.0/).

## Environment contract found in code

| Variable | Consumer | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | MongoDB initializer | MongoDB connection string |
| `PORT` | HTTP server | backend listen port |
| `FRONTEND_SERVER_URL` | CORS | exact allowed frontend origin |
| `JWT_SECRET` | auth | JWT signing/verifying secret |
| `JWT_EXPIRES_IN` | auth | cookie lifetime in days |
| `NODE_ENV` | MongoDB/Redis/scripts | `development`, `test`, or `production` behavior |
| `REDIS_URL` | Redis client | Redis Stack URL |
| `SIGHTENGINE_USER` | moderation | API user |
| `SIGHTENGINE_API_KEY` | moderation | API secret |
| `SIGHTENGINE_WORKFLOW` | image moderation | workflow identifier |
| `AWS_S3_LAMBDA_BASE_URL` | media utilities | upload/delete facade base URL |

The frontend expects `APP_SERVER_URL` to point to this backend and defaults its
development host to `127.0.0.1`. Setup instructions should use `127.0.0.1`
consistently on both sides.

## Confirmed setup blockers

1. **Credential-like values are committed in `env_template`.** Replace every
   secret/account/workflow value with a descriptive placeholder. Because they
   have been public in Git history, the owner should consider the original
   values exposed and revoke/rotate them even if the services are retired.
2. **npm scripts use Windows `set VAR=value&` syntax.** `dev`, `prod`, and
   `test` are not portable to the Linux environment used by GitHub Actions or
   typical macOS/Linux development. Prefer a cross-platform environment tool
   or set `NODE_ENV` within a small Node launcher.
3. **The documented test command is ambiguous.** `npm run test <path>` does not
   reliably forward the path; the conventional form is `npm test -- <path>`.
4. **The lint aggregate does not run JavaScript linting.** `npm run lint` only
   invokes filename and EditorConfig checks, despite `lint:js` existing.
5. **`lint:js` expands into ignored dependencies.** The shell glob
   `./**/*.js` reaches `node_modules`; lint a stable source target instead.
6. **ESLint describes browser ES modules, not Node CommonJS.** This produces
   1,319 mostly configuration-generated findings. With Node and Mocha globals
   enabled, the scan reduces to 38 actionable findings.
7. **EditorConfig checker is platform-limited.** Version `5.1.1` attempts to
   fetch a binary that does not exist for Linux ARM64. The aggregate `lint`
   command therefore runs the portable JavaScript and filename checks; the
   optional `npm run lint:editorconfig` command remains available on supported
   platforms.
8. **The Node baseline is not declared consistently.** CI correctly installs
   the confirmed Node 18 baseline, but `node` is also listed as an application
   dependency and resolves to Node 20 in the lockfile; no `engines` field states
   the supported version. Node itself should not normally be an app dependency.
9. **Redis requirements are under-documented.** The implementation calls
   `redisClient.json`, so plain Redis is insufficient. Setup must explicitly
   say Redis Stack/RedisJSON and explain the supplied config mount.
10. **No startup readiness or reduced-function behavior is documented.**
    MongoDB and Redis initialize as import side effects. A first-time reader
    needs to know what failure output to expect and which flows need replacement
    Sightengine or AWS endpoints supplied by the user.

## Baseline review command results (before polish)

| Command/check | Result |
| --- | --- |
| `npm ci` | completed; npm reported 63 dependency vulnerabilities (13 low, 15 moderate, 30 high, 5 critical) under Node 24/npm 12 |
| `npm run lint` | failed when EditorConfig checker could not obtain an ARM64 binary |
| `npm run lint:js` | failed because the glob selected an ignored path under `node_modules` |
| direct ESLint with current config | 1,319 findings, overwhelmingly missing Node/CommonJS globals |
| direct ESLint with Node + Mocha environments | 38 findings, including real undefined variables and unused code |
| static relative-import reachability scan | no orphaned production JavaScript files |
| Git working tree before documentation | clean `main`, aligned with `origin/main` |

After the polish changes, `npx eslint . --ext .js` passes. The aggregate
`npm run lint` is portable on this environment because it excludes the
platform-specific EditorConfig binary; that optional check remains separately
documented above.

The integration suite was not represented as passing during this documentation
review. It needs Redis Stack, MongoDB Memory Server's install/runtime binary,
correct cross-platform environment handling, and potentially external-service
isolation before a truthful result can be recorded.

## Resolved setup decisions

1. Use Node 18 consistently in local instructions, package metadata, and CI.
2. Use MongoDB 6.0 as the historical local compatibility baseline. The exact
   patch used by the original team is unknown, so prefer the latest available
   6.0 patch when reproducing the artifact.
3. State that the original Sightengine and AWS integrations are retired.
   Builders may supply their own compatible endpoints and credentials through
   the documented environment variables; the repository will not provide
   substitute services or working credentials.
4. Redact all credential-like values before the repository becomes public.
   Replace them with unmistakable placeholders and treat the historical values
   as exposed.
