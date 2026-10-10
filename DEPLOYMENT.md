# Deploy on Vercel with aadityapfp.dev

This project uses Vercel's native Django support. No legacy `api/index.py`,
custom rewrites, or `@vercel/python` build configuration is needed.

## 1. Publish the updated source

Review and push the portfolio changes to https://github.com/Aadityaae/aaditya-portfolio.
Do not commit `.env`, `db.sqlite3`, or account credentials.

## 2. Import into Vercel

Choose Add New > Project and import that repository. The root directory is
the repository root (where `manage.py` is). Use the Django framework preset.
Leave build/output overrides at their defaults: Vercel detects the WSGI app
and runs `collectstatic` using `STATIC_ROOT`.

Add environment variables for Production and Preview:

| Variable | Value |
| --- | --- |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_SECRET_KEY` | A new random secret; generate locally using `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `EMAIL_HOST_USER` | Your Gmail sender address, if using the contact form |
| `EMAIL_PASSWORD` | Its Gmail app password, if using the contact form |

Vercel supplies `VERCEL`, `VERCEL_URL`, and production/branch hostnames.
Settings allow these exact hosts plus `aadityapfp.dev` and `www.aadityapfp.dev`.
If a deployment uses an additional hostname, set `DJANGO_ALLOWED_HOSTS`.

Deploy and verify the `.vercel.app` site before changing DNS. Check images,
CSS, gallery, navigation and the contact form. Email delivery requires valid
SMTP credentials; a successful homepage load does not verify email delivery.

## 3. Connect the domain

In the Vercel project's Settings > Domains, add both `aadityapfp.dev` and
`www.aadityapfp.dev`. Set `aadityapfp.dev` as the primary site and redirect
`www` to it. Copy the exact DNS values Vercel displays for this project.

If Name.com is the authoritative DNS provider, open Name.com > My Domains >
aadityapfp.dev > Manage DNS Records. If the nameservers point elsewhere,
edit DNS at that provider instead.

| Record | Name.com Host | Answer |
| --- | --- | --- |
| A | Blank (root domain) | Exact IP shown by Vercel for `aadityapfp.dev` |
| CNAME | `www` | Exact target shown by Vercel for `www.aadityapfp.dev` |
| TXT, if requested | Exact verification host shown by Vercel | Exact verification value shown by Vercel |

Replace conflicting Render/parking A, AAAA or CNAME records for these two
hosts only. Keep MX, email TXT and unrelated subdomain records. Keep Name.com
nameservers if using its DNS; a registrar transfer is unnecessary.

Wait until Vercel reports valid configuration and provisions HTTPS. Verify
both domains, redirects and the contact form. Keep Render running until the
domain works through Vercel, then retire the old service if desired.

## Database limitation

The homepage and contact form do not read/write the database. Django admin,
database-backed sessions and future saved content require an external database;
local SQLite is not persistent storage on Vercel. Do not run migrations against
SQLite as a Vercel build workaround. Set up PostgreSQL and run migrations against
that database before enabling admin or persistent data features.

## References

- https://vercel.com/docs/frameworks/full-stack/django
- https://vercel.com/docs/domains/working-with-domains/add-a-domain
- https://cs.name.com/hc/en-us/articles/206127137-Adding-DNS-records-and-templates
- https://vercel.com/kb/guide/is-sqlite-supported-in-vercel
