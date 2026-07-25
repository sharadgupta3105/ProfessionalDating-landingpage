# MatchedIn Marketing & Compliance Website

Static multi-page site for MatchedIn (professional dating for Indian professionals). Wired to the same backend API as the mobile app for account deletion and OTP sign-in.

## Pages

| File | Description |
|------|-------------|
| `index.html` | Home / landing page |
| `faq.html` | Frequently asked questions (accordion) |
| `safety.html` | Safety center & emergency resources |
| `privacy.html` | Privacy policy |
| `contact.html` | Contact form (opens mail client) |
| `community-guidelines.html` | Community guidelines & terms |
| `delete-account.html` | **Live** account deletion (OTP + `DELETE /users/me`) |
| `play-store-guide.html` | Google Play / app store compliance guide |

## Deploy on Netlify (free)

See **[NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md)** for step-by-step instructions.

Quick summary: connect the GitHub repo — root `netlify.toml` sets base directory `website` and runs `npm run build` before publish.

## Run locally

**1. Start the API** (from `backend/`):

```bash
npm run dev
```

**2. Serve the website** (from this folder):

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080). The site uses `http://localhost:5000` as the API when hosted on localhost.

For production hosting, set the API URL in each page head (or rely on the built-in Elastic Beanstalk default):

```html
<meta name="linkedup-api-url" content="https://your-api.example.com" />
```

Ensure `CORS_ORIGINS` on the API includes your site origin (or `*` for testing).

## Structure

```
website/
├── index.html
├── *.html
├── assets/js/
│   ├── config.js   # API URL & support email
│   ├── api.js      # Auth + delete account API calls
│   └── site.js     # Mobile menu, forms, FAQ accordion
├── DESIGN.md
└── link-pages.py   # Re-wire nav links after Stitch exports
```

## Features

- **Delete account (Google Play)** — Email OTP verification, then permanent deletion via `DELETE /users/me` (same as the app). In-app path documented on the page.
- **Contact form** — Validates fields and opens the user’s email app with a pre-filled message to `help@matchedin.app`.
- **Mobile menu** — Hamburger slide-out on small screens.
- **FAQ accordions** — Expand/collapse on the FAQ page.
- **Report a concern** — Safety / contact links with `?topic=report` pre-selects the report topic.

## Dev OTP

When the API runs in development mode, use OTP code **123456** after requesting a code for any email.

## Updating from Stitch exports

Copy new HTML into `website/`, then:

```bash
python3 link-pages.py
```

This re-applies navigation links, meta tags, and shared scripts.

Then run `python3 link-pages.py` again before committing if you use Netlify Git deploy (build runs `npm run build` which patches meta tags for production).
