# Admin dashboard — security requirements

The requirements were written before the dashboard existed, so they were agreed in
advance. The **foundation** (authentication and authorization) is now implemented;
the dashboard UI is still to be built. `IMPLEMENTED` marks what exists today.

## Repository visibility is not a security control

The repository is public (see `DEPLOYMENT.md` § 7). That is an accepted
trade-off, and it does **not** by itself make the admin dashboard insecure — nor
would a private repository have made it secure. Treat the two as unrelated.

Two facts drive the requirements below:

1. **Client-side code is always readable.** An admin page ships JavaScript to the
   browser. Anyone who can load it can read it, whatever the repository's
   visibility. Hiding routes or logic in the front end is not protection.
2. **A public repository is unforgiving of mistakes.** Credentials are scraped
   automatically and history is permanent. A secret committed and later removed
   is still disclosed.

## Non-negotiable requirements

### Authentication

- `IMPLEMENTED` Every admin API route authenticates **server-side on every request**. No
  exceptions for routes that "only the dashboard calls". (`src/lib/auth/guard.ts`.)
- `IMPLEMENTED` Session state is validated server-side. A cookie or token is a claim, not
  proof; verify it. Verification is Clerk's (`auth()`), with no local fallback.
- Passwords, if used, are hashed with a memory-hard algorithm (bcrypt, scrypt or
  Argon2). Never store or log a plaintext password. Passwords never reach this
  application: Clerk holds credentials, and no password is stored here.

### Authorization

- `IMPLEMENTED` Enforce role checks **on the server** for every privileged action.
  Checking a role in the UI only hides a button; it does not prevent the request.
- `IMPLEMENTED` Deny by default. An unrecognised role gets nothing. A missing Clerk
  configuration is an explicit 503, never an implicit "no protection needed".
- `IMPLEMENTED` The administrator role is read from `publicMetadata`, which only the
  Clerk server SDK or Dashboard can write. The `ADMIN_EMAILS` allow-list is an
  additional server-only grant, matched only against the verified session email.

### Secrets

- All credentials live in Vercel **Settings → Environment Variables**. Never in
  the repository, never in `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_` values are embedded in the public bundle. A secret behind that
  prefix is published, regardless of repository visibility.
- `.env*` stays git-ignored; only `.env.example` with placeholders is committed.
- Rotate any credential that is ever committed by accident. Removing it from the
  working tree does not remove it from history.

### Data

- `IMPLEMENTED` Customer orders are not collected until the database, authentication and
  authorization above are all in place. A database is required to store orders and
  an admin session is required to read or change them.
- Never log credentials, session tokens or full personal records.
- Validate and sanitise all input server-side, including anything from the admin
  UI.

### Transport and headers

- HTTPS only (Vercel provides this).
- `IMPLEMENTED` Keep the admin area out of search engines: `/admin` and `/sign-in` set
  `robots: noindex` metadata.
- Set a Content-Security-Policy once the dashboard exists.
- `OPEN` Add rate limiting to authentication endpoints to blunt credential stuffing.
  Clerk exposes attack protection; this has not been configured yet.

## Review checklist

Before the dashboard handles any real data:

- [x] Every admin route verified to reject unauthenticated requests (`tests/auth.test.ts`).
- [x] Every privileged action verified to reject the wrong role (`tests/auth.test.ts`).
- [ ] No secret in the bundle — grep the built output, not just the source.
- [ ] Full git history re-scanned for credentials.
- [ ] Rate limiting on login.
- [x] Error messages reveal nothing about internal state (`guardFailureResponse`).
