# Office status

A tiny web page that shows whether you and your friend are currently at the
office. Tap a button to toggle your own status; both of you can update your
own state, and either of you can just open the page to check.

The whole thing is one Next.js app you deploy to Vercel for free.

## What you get

- A page with one card per person, each with a green dot when "in" and a button to toggle.
- A timestamp ("Arrived 12 mins ago" / "Left 2 hours ago") so you can tell how recent the status is.
- Status is shared via Vercel KV (a hosted Redis) so both of you see the same thing from any device.
- Optional shared password so a stranger who finds the URL can't toggle your status.

## Deploying — first time

You'll need a free GitHub account and a free Vercel account. Total time: about 10 minutes.

### 1. Push this folder to GitHub

```bash
cd office-status
git init
git add .
git commit -m "Initial commit"
# Create an empty repo on github.com first, then:
git remote add origin https://github.com/<your-username>/office-status.git
git branch -M main
git push -u origin main
```

### 2. Import the project on Vercel

1. Go to <https://vercel.com/new>.
2. Pick the `office-status` repo.
3. Leave all settings on their defaults and click **Deploy**.

It will deploy successfully but won't actually work yet — there's no database
attached. Onwards.

### 3. Add KV storage

1. In your new Vercel project, click **Storage → Create Database**.
2. Choose **KV** (Redis-style key-value store). Name it anything (e.g. `office-status-kv`).
3. When prompted, connect it to the `office-status` project. Vercel will
   automatically inject the four `KV_*` environment variables.
4. Click **Redeploy** on the latest deployment so it picks up the new env vars.

### 4. (Recommended) Set an update password

So that anyone with the URL can _view_ your status but not change it:

1. In the Vercel project, go to **Settings → Environment Variables**.
2. Add a variable named `UPDATE_SECRET` with a long random string as the value
   (e.g. generate one at <https://1password.com/password-generator>).
3. Apply it to all environments (Production, Preview, Development).
4. Redeploy.

Now the first time you or your friend press a toggle, the page asks for that
password. The browser remembers it locally so you only enter it once per device.

If you skip this step, anyone who lands on the URL can toggle your status.

### 5. Share the URL

Give your friend the `*.vercel.app` URL and (if you set one) the password.
That's it.

## Customising

The names and the wording around "the office" live in `app/config.ts`:

```ts
export const PEOPLE = [
  { id: "greg", name: "Greg" },
  { id: "friend", name: "My friend" },
] as const;

export const OFFICE_NAME = "the office";
```

Change `name` freely. Avoid changing `id` after deployment — it's used as the
storage key, so renaming it will look like the previous status was wiped (it
isn't, it's just stored under the old id).

To add a third person, just append another `{ id, name }` entry.

## Running locally

Optional — only needed if you want to tweak the look before redeploying.

```bash
cd office-status
npm install
cp .env.local.example .env.local
# Fill in the KV_* values from your Vercel project's Storage tab.
npm run dev
```

Then open <http://localhost:3000>.

## Project layout

```
office-status/
├── app/
│   ├── api/status/route.ts   # GET + POST status, backed by Vercel KV
│   ├── config.ts             # People + office name (edit me)
│   ├── globals.css           # Styling
│   ├── layout.tsx            # Page shell
│   └── page.tsx              # The UI
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md
```
