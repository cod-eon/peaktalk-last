# Better Auth Admin bootstrap

The first admin is assigned once with the exact user identity approved by the
owner. The identity must be supplied only as the protected runtime variable
`BETTER_AUTH_BOOTSTRAP_ADMIN_EMAIL`; it must not be committed, echoed, or added
to a tracked `.env` file.

Run the one-shot script from the backend runtime after the Better Auth Admin
migration has applied:

```bash
BETTER_AUTH_BOOTSTRAP_ADMIN_EMAIL='(protected runtime value)' \
  python backend/scripts/bootstrap_better_auth_admin.py
```

The script requires exactly one matching verified Better Auth user, refuses to
replace an existing different admin, is idempotent for the assigned identity,
and writes only safe audit metadata. After a successful run, unset the runtime
variable and remove the one-shot script from the release artifact. There is no
web bootstrap endpoint.

## Admin access

After the approved admin identity has been verified and bootstrapped, sign in
through the normal PeakTalk login page and open `/admin` for the overview or
`/admin/users` for user administration.

The frontend guard is only a navigation aid. Every admin data request and
mutation is enforced server-side; a signed-out or ordinary user session cannot
read admin data or perform admin actions.
