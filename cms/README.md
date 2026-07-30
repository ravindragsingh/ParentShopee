# Strapi CMS setup — Math topics & study materials

Math topics and teacher study materials are meant to live in a Strapi
instance instead of the app's own database, so content (questions and
answers, reading material) can be added or edited without a code deploy.

**This has not been run or verified** — the sandbox this was built in has no
internet access, so `npx create-strapi-app` can't reach the npm registry.
Follow these steps on a machine that can, then sanity-check the app against
it before relying on it.

## 1. Scaffold Strapi

```
npx create-strapi-app@latest cms --quickstart
```

(You don't have to nest it inside this repo — the folder name doesn't
matter, only the schema files below do. Adjust paths accordingly if you put
it elsewhere.)

## 2. Add the content type + component

Copy the two schema files from `schemas/` in this folder into the generated
project:

- `schemas/question-component.json` → `cms/src/components/content/question.json`
- `schemas/content-item.json` → `cms/src/api/content-item/content-types/content-item/schema.json`

Restart Strapi (`npm run develop`) so it picks up the new content type —
"Content Item" should now show up in the admin panel's Content-Type Builder,
with a repeatable "Questions" field.

## 3. Open up read access / create an API token

Either:
- **Settings → Roles → Public** — enable `find` and `findOne` on Content Item
  so the app can read published content with no token, or
- **Settings → API Tokens** — create a token (Full Access is simplest for
  local dev) and use it for every request, reads included.

Either way, you'll need a token with *create* access for the seed script in
step 5.

## 4. Point the app backend at it

Set these env vars wherever the FastAPI backend runs:

```
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<the token from step 3>
```

## 5. Seed the existing Math topics

```
cd cms
STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> python seed_strapi.py
```

Entries are created as **drafts** (draftAndPublish is on) — open the Strapi
admin, review the imported topics, and hit **Publish** on each one. The app
only reads published entries.

## 6. Add study materials

There's no bulk import for these — add them one at a time in the Strapi
admin as Content Items with `kind = material` (title, subject, grade,
description/url, and optionally the same repeatable Questions field if you
want students to be able to answer them for points).

## Known limitations (unverified integration)

- **Response shape assumed to be Strapi v5** (flat fields on each item, not
  wrapped in `.attributes` like v4). `backend/strapi_client.py` normalizes
  both shapes defensively, but only the v5 shape has been reasoned through
  carefully — double-check against whatever version `create-strapi-app`
  actually installs.
- **Existing local assignments/shares reference old local topic/material
  IDs.** Once Strapi is the source of truth, those IDs won't resolve through
  `strapi_client.get_content()`. This is a clean-slate cutover for a
  dev/staging environment, not a data migration — plan accordingly before
  doing this against a database with real assignment history.
- The exact Strapi REST filter/query-string syntax (`filters[...]`,
  `$containsi`, etc.) matches Strapi v4/v5's documented format as of when
  this was written, but hasn't been executed against a live instance.
