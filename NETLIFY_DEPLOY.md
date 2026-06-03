# Deploy LinkedUp website on Netlify (free)

## Option A — GitHub (recommended)

1. Push this repo to GitHub.
2. Log in at [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub.
3. Select the `pro-match-app` repository.
4. Netlify reads **`netlify.toml` at the repo root** automatically:
   - **Base directory:** `website`
   - **Build command:** `npm run build`
   - **Publish directory:** `.` (relative to `website`)
5. **Environment variables** (Site configuration → Environment variables):

   | Variable | Value |
   |----------|--------|
   | `LINKEDUP_API_URL` | `http://promatch-api-env.eba-rt5gymna.ap-south-1.elasticbeanstalk.com` (or your HTTPS API later) |
   | `LINKEDUP_SUPPORT_EMAIL` | `support@linkedup.app` |
   | `LINKEDUP_API_PROXY` | `true` (default; routes `/auth` and `/users` through Netlify — required for delete-account on HTTPS) |

6. Click **Deploy site**.
7. After deploy, open `https://YOUR-SITE.netlify.app/delete-account.html` and test OTP delete flow.

### Custom domain (e.g. linkedup.app)

1. Netlify → **Domain management** → **Add domain** → enter `linkedup.app` and `www.linkedup.app`.
2. At your domain registrar, add the DNS records Netlify shows (usually ALIAS/ANAME or CNAME).
3. Wait for HTTPS (automatic).

### Backend CORS

On Elastic Beanstalk (or your API host), set:

```bash
CORS_ORIGINS=https://YOUR-SITE.netlify.app,https://linkedup.app,https://www.linkedup.app
```

Or `*` while testing only.

---

## Option B — Manual zip (no Git)

From your machine:

```bash
cd website
npm run build
```

Zip **everything inside** `website/` (including `_redirects`, `assets/`, all `.html` files).  
Upload at [https://app.netlify.com/drop](https://app.netlify.com/drop).

Note: manual deploys do not re-run the build on each upload — run `npm run build` before every zip.

---

## What the build does

- Sets meta tags (`linkedup-api-proxy`, support email, API URL).
- Writes **`_redirects`** to proxy `/auth/*` and `/users/*` to your API (fixes HTTPS site calling HTTP API).
- Enables clean URLs: `/privacy`, `/delete-account`, etc.

---

## Play Console URLs

After deploy, use:

| Page | URL |
|------|-----|
| Privacy | `https://your-domain/privacy` or `.../privacy.html` |
| Delete account | `https://your-domain/delete-account` |
| Contact | `https://your-domain/contact` |

Update `EXPO_PUBLIC_LEGAL_BASE_URL` in `mobile/eas.json` to your Netlify or custom domain.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Delete account / OTP fails | Ensure `LINKEDUP_API_PROXY=true` and redeploy; check browser Network tab calls go to `https://your-site.netlify.app/auth/...` |
| CORS error | Add your Netlify URL to API `CORS_ORIGINS` |
| 404 on `/privacy` | Redeploy so `_redirects` is generated (`npm run build`) |
| Build fails | Node 18+; run `npm run build` locally to see errors |
