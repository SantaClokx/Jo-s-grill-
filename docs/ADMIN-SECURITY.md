# Admin dashboard — security requirements

Written before the dashboard exists, so the requirements are agreed in advance.
Nothing here is implemented yet.

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

- Every admin API route authenticates **server-side on every request**. No
  exceptions for routes that "only the dashboard calls".
- Session state is validated server-side. A cookie or token is a claim, not
  proof; verify it.
- Passwords, if used, are hashed with a memory-hard algorithm (bcrypt, scrypt or
  Argon2). Never store or log a plaintext password.

### Authorization

- Enforce role checks **on the server** for every privileged action. Checking a
  role in the UI only hides a button; it does not prevent the request.
- Deny by default. An unrecognised role gets nothing.

### Secrets

- All credentials live in Vercel **Settings → Environment Variables**. Never in
  the repository, never in `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_` values are embedded in the public bundle. A secret behind that
  prefix is published, regardless of repository visibility.
- `.env*` stays git-ignored; only `.env.example` with placeholders is committed.
- Rotate any credential that is ever committed by accident. Removing it from the
  working tree does not remove it from history.

### Data

- Customer orders are not collected until the database, authentication and
  authorization above are all in place.
- Never log credentials, session tokens or full personal records.
- Validate and sanitise all input server-side, including anything from the admin
  UI.

### Transport and headers

- HTTPS only (Vercel provides this).
- Set a Content-Security-Policy once the dashboard exists, and keep the admin
  area out of search engines (`X-Robots-Tag: noindex`).
- Add rate limiting to authentication endpoints to blunt credential stuffing.

## Review checklist

Before the dashboard handles any real data:

- [ ] Every admin route verified to reject unauthenticated requests.
- [ ] Every privileged action verified to reject the wrong role.
- [ ] No secret in the bundle — grep the built output, not just the source.
- [ ] Full git history re-scanned for credentials.
- [ ] Rate limiting on login.
- [ ] Error messages reveal nothing about internal state.
