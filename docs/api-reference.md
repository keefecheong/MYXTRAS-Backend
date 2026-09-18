# HTTP and Socket.IO interface inventory

This is a route-level inventory of the implemented interface, not a complete
request/response schema. Unless noted otherwise, routes require the `authapi`
JWT cookie. `{id}` names below correspond to Express path parameters.

## Users and profiles

| Method | Path | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/users/register` | register an account | public |
| `POST` | `/api/users/login` | authenticate and set cookie | public |
| `POST` | `/api/users/verify/email` | check email availability | public |
| `POST` | `/api/users/verify/phone` | check phone availability | public |
| `POST` | `/api/users/verify/username` | check username availability | public |
| `GET` | `/api/users/profile` | current profile | user |
| `PATCH` | `/api/users/profile` | edit current profile/media | user |
| `PATCH` | `/api/users/profile/setup` | initial profile setup | user |
| `GET` | `/api/users/profile/{userId}` | requested profile | user |
| `GET` | `/api/users/cookie/verify` | verify current session | user |
| `GET` | `/api/users/cookie/remove` | clear session cookie | user |
| `POST` / `DELETE` | `/api/users/{userId}/follow` | follow/unfollow user | user |
| `POST` / `DELETE` | `/api/users/{userId}/block` | block/unblock user | user |

## Posts and comments

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/posts/following` | own and followed-user feed |
| `GET` | `/api/posts/explore` | popular posts |
| `GET` | `/api/posts/by/self` | current user's posts |
| `GET` | `/api/posts/by/{userId}` | a user's posts |
| `GET` | `/api/posts/saved` | saved posts |
| `POST` | `/api/posts` | create multipart post |
| `PATCH` / `DELETE` | `/api/posts/user/{userId}/post/{postId}` | update/delete post |
| `GET` / `POST` | `/api/posts/user/{userId}/post/{postId}/comments` | list/create comments |
| `DELETE` | `/api/posts/user/{userId}/post/{postId}/comments/{commentId}` | delete comment |
| `POST` / `DELETE` | `/api/posts/user/{userId}/post/{postId}/likes` | like/unlike post |
| `POST` / `DELETE` | `/api/posts/user/{userId}/post/{postId}/save` | save/unsave post |

## Forums and threads

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/forums/created` | forums created by current user |
| `GET` | `/api/forums/subscribed` | subscribed forums |
| `GET` | `/api/forums/categorized` | categorized forum lists |
| `GET` | `/api/forums/recommended` | recommended forums |
| `POST` | `/api/forums` | create multipart forum |
| `POST` | `/api/forums/verify-forumId` | check public forum ID |
| `GET` / `PATCH` / `DELETE` | `/api/forums/{forumId}` | read/update/delete forum |
| `POST` / `DELETE` | `/api/forums/{forumId}/subscribe` | subscribe/unsubscribe |
| `GET` | `/api/threads/explore` | explore threads |
| `GET` | `/api/threads/popular` | popular threads |
| `GET` | `/api/threads/recent` | recent threads |
| `GET` | `/api/threads/forum/{forumId}` | forum's threads |
| `POST` | `/api/threads/{forumId}` | create multipart thread |
| `PATCH` / `DELETE` | `/api/threads/forum/{forumId}/thread/{threadId}` | update/delete thread |
| `POST` / `DELETE` | `/api/threads/forum/{forumId}/thread/{threadId}/like` | like/unlike thread |
| `POST` / `DELETE` | `/api/threads/forum/{forumId}/thread/{threadId}/dislike` | dislike/remove dislike |
| `GET` / `POST` | `/api/threads/forum/{forumId}/thread/{threadId}/comments` | list/create comments |
| `DELETE` | `/api/threads/forum/{forumId}/thread/{threadId}/comments/{commentId}` | delete comment |

## Chat

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/chats` | current user's chats |
| `GET` | `/api/chats/latestMessages` | latest messages for recent chats |
| `GET` | `/api/chats/check/{userId}` | find/create conversation context |
| `GET` | `/api/chats/{chatId}/{count}` | newest message page |
| `GET` | `/api/chats/{chatId}/{oldestMessageTime}/{count}` | earlier message page |

Socket.IO uses namespace `/chatSocket` and the same cookie authentication.

| Direction | Event | Purpose |
| --- | --- | --- |
| client → server | `send-message` | send text or initiate attachment message |
| client → server | `file-chunk` | stream attachment data |
| client → server | `edit-message` | edit a message |
| client → server | `delete-message` | delete a message |
| client → server | `query-user-presence` | request online state |
| client → server | `user-typing` | publish typing state |
| server → client | `receive-message` | deliver new message |
| server → client | `receive-edit-message` | deliver edit |
| server → client | `receive-delete-message` | deliver deletion |
| server → client | `update-user-presence` | update online state |
| server → client | `receive-user-typing` | update typing state |
| server → client | `file-upload-result` | report attachment result |
| server → client | `unauthorized`, `server-error` | connection failure |

## Reports and administration

| Method | Path | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/report/user/submitted` | current user's reports | user |
| `POST` | `/api/report/submit/user/{userId}` | report user | user |
| `POST` | `/api/report/submit/user/{userId}/post/{postId}` | report post | user |
| `POST` | `/api/report/submit/forum/{forumId}` | report forum | user |
| `POST` | `/api/report/submit/forum/{forumId}/thread/{threadId}` | report thread | user |
| `POST` | `/api/report/submit/.../comment/{commentId}` | report post/thread comment | user |
| `POST` | `/api/report/submit/message/{messageId}` | report message | user |
| `GET` | `/api/admin/report/pending` | pending reports | admin |
| `GET` | `/api/admin/report/reviewed` | reviewed reports | admin |
| `GET` | `/api/admin/report/by/{userId}` | reports submitted by user | admin |
| `GET` | `/api/admin/report/for/{userId}` | reports against user | admin |
| `GET` | `/api/admin/report/user/{userId}/messages/{messageId}` | report chat context | admin |
| `PATCH` | `/api/admin/report/resolve/failed/{objectId}` | reject report | admin |
| `PATCH` | `/api/admin/report/resolve/success/...` | accept report and apply target-specific action | admin |
| `GET` | `/api/admin/accounts/admin` | list users | admin |
| `POST` / `DELETE` | `/api/admin/accounts/admin/{userId}` | promote/demote admin | admin |
| `POST` / `DELETE` | `/api/admin/accounts/suspend/{userId}` | suspend/unsuspend | admin |
| `POST` / `DELETE` | `/api/admin/accounts/terminate/{userId}` | terminate/restore | admin |

The accepted-report routes have target-specific variants for suspending or
terminating users and deleting posts, forums, threads, comments, or messages.

## Gamification, events, search, and reference data

| Method | Path | Purpose | Access |
| --- | --- | --- | --- |
| `GET` / `POST` | `/api/gamification/daily-checkin` | read/perform check-in | user |
| `GET` | `/api/gamification/missions` | list daily missions | user |
| `POST` | `/api/gamification/missions/{title}` | claim mission | user |
| `GET` | `/api/gamification/gachapon` | gems and pet inventory | user |
| `POST` | `/api/gamification/gachapon/enabled` | enable pets | user |
| `POST` | `/api/gamification/gachapon/{numOfRolls}` | perform rolls | user |
| `POST` | `/api/gamification/pets/{pet}` | select pet | user |
| `GET` | `/api/events` | list events | user |
| `POST` | `/api/events` | create event | user (current route behavior) |
| `PATCH` / `DELETE` | `/api/events/{eventId}` | update/delete event | admin |
| `GET` | `/api/search/users-forums?term=...` | combined search | user |
| `GET` | `/api/search/users?term=...` | user search | user |
| `GET` | `/api/search/forums?term=...` | forum search | user |
| `GET` | `/api/schools` | static school/course data | public |

The create-event route is authenticated but does not currently request the
admin-only branch of the auth middleware. The polish pass should verify intent
against the frontend and either document this accurately or apply a narrowly
scoped authorization correction.

