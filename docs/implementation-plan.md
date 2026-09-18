# Presentation polish implementation plan

## Execution status

The bounded polish pass is implemented on the `polish` branch. It includes
credential redaction, Node 18/tooling alignment, a professional root README,
portable lint/test commands, stale-comment/debug cleanup, and the confirmed
moderation, media, gamification, cache, and Socket.IO corrections described
below. The integration suite remains environment-dependent: this review host
does not provide Redis Stack and MongoDB Memory Server's downloaded binary
requires a compatible platform library.

## Objective and constraints

Present MYXTRAS as a coherent historical capstone backend while preserving the
features and architectural intent of the final `main` commit. The work should
improve discoverability, reproducibility, consistency, and honesty about the
artifact's status.

### Explicit non-goals

- no new product features;
- no production deployment, observability platform, scaling work, or service
  redesign;
- no framework migration, TypeScript conversion, database redesign, or API
  versioning initiative;
- no broad dependency upgrade justified only by `npm audit` totals;
- no speculative optimization or refactoring of working feature flows;
- no promise of active support or ongoing maintenance.

Security-sensitive values must still be removed from the public template; that
is repository hygiene, not production hardening.

## Phase 0 — preserve the baseline

1. Tag or record `2454ca71053af2aeff18c1cc71eb53da0872a1ae` as the original
   capstone baseline.
2. Keep each polish commit narrow: documentation, configuration/setup,
   dead-code cleanup, then verified defect fixes.
3. Before every implementation phase, confirm unrelated user changes are not
   overwritten.

**Acceptance criteria:** the original artifact remains identifiable, and the
diff can be explained as presentation polish rather than a rewrite.

## Phase 1 — repository-facing documentation (highest priority)

Replace the root README with a concise portfolio-quality entry point:

1. project name and one-paragraph description;
2. an archival/unmaintained status notice without apologetic language;
3. feature summary limited to implemented capabilities;
4. technology summary;
5. architecture overview linked to `docs/architecture.md`;
6. companion frontend link:
   <https://github.com/keefecheong/MYXTRAS-Frontend>;
7. prerequisites and a verified quick start;
8. test/lint commands with honest status;
9. environment-variable table with no secrets;
10. repository map and links to the API/codebase documentation;
11. known limitations focused on the historical artifact; and
12. license/team attribution only where facts can be confirmed.

Retain and refine the documents created by this review. Avoid badges for CI,
coverage, deployment, or dependency health unless their targets genuinely work.

**Acceptance criteria:** a recruiter or engineer can understand the product,
implemented feature breadth, architecture, related frontend, and project status
from the first screen and follow links for technical depth.

## Phase 2 — sanitize configuration and make setup reproducible

1. Replace `env_template` with a conventional `.env.example` (or keep the
   existing name only if history is important) containing placeholders and
   comments, never working-looking credentials.
2. Treat all currently committed JWT/Sightengine values as exposed and redact
   them before making the repository public. Revoke/rotate them where the old
   accounts still exist; do not rewrite Git history unless explicitly
   requested.
3. Standardize on the confirmed Node 18 baseline, declare it in `engines` and
   optionally an `.nvmrc`, retain the matching CI version, and remove the
   conflicting `node` package dependency.
4. Make `dev`, `test`, and any retained production/demo command
   cross-platform. Remove PM2 from the presentation path if deployment is no
   longer part of the artifact; do not add a new deployment mechanism.
5. Document a copy/pasteable Redis Stack Docker command, MongoDB 6.0 startup or
   connection expectation, `.env` creation, `npm ci`, and server startup. Label
   MongoDB 6.0 as the July 2023 reproduction baseline and note that it is now
   end-of-life.
6. Explain the frontend's matching `APP_SERVER_URL` and consistent
   `127.0.0.1` origins.
7. State which flows require Sightengine/media services. Document that the
   original services are retired and that builders can provide their own
   compatible endpoints and credentials; do not build replacement services.
8. Consider a small startup configuration validator only if it materially
   improves setup errors; keep it limited to existing required variables.

**Acceptance criteria:** a clean clone on the documented Node version can
install and reach a known startup state by following the README exactly, with
no real secrets copied from the repository.

## Phase 3 — repair quality tooling and CI

1. Configure ESLint for Node/CommonJS and Mocha test files. Remove the blanket
   `server.js` ignore unless a specific, documented exception remains.
2. Replace the recursive shell glob with stable ESLint targets or `eslint .`
   plus proper ignores.
3. Include `lint:js` in the aggregate `lint` command. Remove `lint:css` from the
   backend if it has no CSS inputs.
4. Keep the ARM64-incompatible EditorConfig checker as an optional command and
   exclude it from the portable aggregate lint command; do not add tool churn.
5. Update GitHub Actions checkout/setup actions to supported versions and use
   the same declared Node version as local setup.
6. Correct test argument forwarding and consolidate the repeated CI test list
   into an explicit `test:integration` script if this can be done without
   changing test behavior.
7. Add Redis readiness before tests instead of assuming the container is ready.
8. Do not introduce coverage thresholds or a large new testing framework.

**Acceptance criteria:** `npm run lint` executes the intended checks and passes;
CI and local documentation invoke the same commands and Node version.

## Phase 4 — bounded dead/inconsistent-code cleanup

Apply mechanical cleanup only after lint configuration is truthful:

1. remove unused imports/variables identified in forum, gamification, and user
   files;
2. remove the stale commented `petsRouter.get` line and commented interval in
   gamification initialization, or replace it with a short rationale if needed;
3. correct misleading copy/paste comments such as routers described as handling
   posts/comments when they handle chats, events, or gamification;
4. standardize formatting through the existing conventions (quotes, trailing
   commas, whitespace) without mass-rewriting unrelated logic;
5. classify remaining `console` calls:
   - retain concise server/database/cache lifecycle logs;
   - retain actionable error reporting;
   - remove test/debug data such as the in-memory MongoDB URI;
   - replace swallowed `.catch(console.log)` paths only where the existing
     request/socket flow can return or emit an established error;
6. review `test.rest` for stale hosts, credentials, IDs, and payloads; sanitize
   or move it to an examples location if it remains useful;
7. retain placeholder test blocks only if Mocha otherwise rejects suites and
   document why; otherwise remove the helper and empty scaffolding.

The reachability scan found no orphaned production module, so do not perform
bulk file deletion.

**Acceptance criteria:** no stale TODO/FIXME/debug output or commented-out
behavior remains; every deletion has a concrete unused/stale justification;
format-only churn is limited.

## Phase 5 — fix confirmed defects in existing features

These are not new capabilities. Address them in small commits with a targeted
test or direct verification where practical.

### Highest-confidence runtime defects

1. `admin/utils/moderation/moderateText.js` uses undeclared `data`; define the
   intended `FormData` instance and verify the current moderation request.
2. `event/controllers/eventSaveController.js` references undeclared `index`.
3. `gamification/controllers/gamificationController.js` references undeclared
   `allClaimed`.
4. `gamification/controllers/petsController.js` references undeclared
   `storedPet`.
5. `gamification/utils/updateUserTasks.js` references undeclared
   `setLockedFalse` and contains an unconditional loop; compare call sites and
   preserve the existing mission rules.
6. `utils/s3/s3Upload.js` references undeclared `fileLink`.
7. `chat/sockets/chatHandler.js` uses an `Array.some` callback without returning
   its condition, so `existingConnection` never becomes true; also ensure the
   middleware always calls `next` exactly once.
8. `gamification/utils/init.js` can invoke reset twice in the midnight cron
   callback (`checkDateAndReset()` and a direct `resetDailyMissions()` call).

### Consistency/correctness review

1. Verify whether event creation should be admin-only; update either route
   authorization or documentation based on original UI intent.
2. Wrap lexical declarations in `switch` cases in report resolution and search
   controllers.
3. Replace direct `object.hasOwnProperty` calls with the safe built-in form in
   four cache update modules.
4. Remove unused login status constants and other lint-confirmed imports.
5. Simplify unnecessary regular-expression escapes without changing password
   acceptance behavior.
6. Confirm socket authentication includes the same suspension/termination
   policy as HTTP. If differing behavior was intentional, document it; if not,
   apply the smallest consistency fix.

**Acceptance criteria:** corrected flows retain their public API, targeted
verification covers each changed behavior, and ESLint reports no undefined
variables.

## Phase 6 — verify the historical integration suite

1. Start a disposable Redis Stack instance with the checked-in configuration.
2. Confirm MongoDB Memory Server works on the declared Node/platform matrix.
3. Run each existing suite in the same order as CI:
   admin, chat, comment, forum, post, thread, and user.
4. Record failing behavior before changing it. Fix only failures caused by the
   polish work or clear defects in already implemented functionality.
5. Add tests only for the defect fixes in Phase 5 and for setup-critical
   behavior; do not chase broad coverage.
6. Stop/remove disposable test infrastructure and confirm the worktree contains
   no generated artifacts.

**Acceptance criteria:** README commands reproduce the recorded outcome. If an
external retired service prevents a suite or flow, the limitation is explicit
and is not disguised as a passing result.

## Phase 7 — final presentation review

1. Inspect the repository landing page as a new visitor.
2. Follow every local and external documentation link.
3. Run secret scanning and ensure templates/examples contain placeholders.
4. Run the documented install, lint, startup, and test commands from a clean
   clone on the declared platform.
5. Ensure no claims imply current deployment, production readiness, or active
   maintenance.
6. Review the final diff against the original commit and remove changes that do
   not serve clarity, reproducibility, consistency, or confirmed correctness.

**Acceptance criteria:** the artifact is coherent and candid, the original
feature set remains recognizable, and every setup/verification claim has been
personally reproduced or explicitly marked unverified.

## Proposed commit sequence

1. `docs: document project architecture and archived status`
2. `chore: sanitize environment example and align node setup`
3. `chore: repair lint and test commands`
4. `chore: remove stale comments and dead code`
5. `fix: correct existing moderation media and gamification defects`
6. `fix: correct chat authentication and mission reset flow`
7. `test: verify corrected existing behavior`
8. `docs: finalize reproducible setup and verification status`

This ordering keeps review straightforward and allows any behavior-changing
fix to be omitted without weakening the documentation/presentation work.
