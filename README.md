# Bishwa Prakash Subedi — Portfolio

A responsive personal portfolio for presenting graduate research, technical interests, and hands-on projects. The public site is static HTML, CSS, and JavaScript on GitHub Pages. A Node/Express API, Supabase Postgres/Auth, and a form-based admin page are being added as Version 2.

**Live site:** <https://bishwa011.github.io/portfolio-website/>

**Source repository:** <https://github.com/bishwa011/portfolio-website>

## Project structure

```text
portfolio-website/
├── index.html                  # Page content, metadata, and section structure
├── css/
│   └── style.css                # Colors, layout, responsive design, and focus styles
├── js/
│   └── main.js                  # Mobile navigation and current year
│   ├── content.js               # Loads editable content from the API when configured
│   ├── admin.js                 # Admin sign-in, form fields, and save request
│   └── backend-config.js        # Local API URL; add deployed API URL after setup
├── assets/
│   └── research-network.svg     # Local illustration used in the home section
├── server/
│   └── index.js                 # Express API and Supabase authentication/data requests
├── supabase/
│   └── schema.sql               # PostgreSQL table, seed content, and row access policies
├── admin.html                   # Private portfolio editor UI (sign-in required to read/write)
├── package.json                 # Node version and Express dependencies
├── .node-version                # Node 24.22.1 for local/hosted consistency
├── .env.example                 # Local environment-variable template
├── render.yaml                  # Render API service setup
├── requirements.md              # Local project scope and learning roadmap
├── conversation.md              # Local decisions and learning notes
└── .gitignore                   # Keeps the two learning notes out of the public repo
```

The static HTML remains the page structure and fallback content. Once the backend is configured, `content.js` replaces editable text and cards with the published database content. `admin.html` gives you forms for editing profile fields and list entries. Its JavaScript sends one validated content update to the API; Express verifies your Supabase session, and PostgreSQL row-level security independently checks admin access.

`requirements.md` and `conversation.md` are kept in the local learning folder and excluded from the public website repository.

## Technologies

- HTML5 with semantic sections and accessible labels
- CSS3 with responsive layouts and reduced-motion support
- Vanilla JavaScript for the public site and admin forms
- Node.js 24 and Express 5 for the backend API
- Supabase Postgres, Auth, Storage, and row-level security
- Render free web service for API hosting
- Local SVG artwork

## Run the static site locally

1. Open the `portfolio-website` folder.
2. Open `index.html` in a browser.

No local server is required for the static version. The admin page and API need local servers; see **Run the backend locally** below.

## Customize the content

Before the backend is connected, edit visible content in `index.html`. After the backend is set up, use `admin.html` for profile and portfolio content; source edits remain necessary for layout and code changes.

- Add verified publication titles, exact statuses, and paper/DOI links in the admin page. Research directions and publications are separate lists.
- Add projects with accurate descriptions and working repository/demo links. Mark projects as completed, in progress, or planned.
- Add only technologies and methods you can support from your experience.
- Add a profile photo, project images, paper/poster/résumé PDFs, email, and profile links when ready. Uploads are limited to 15 MB and supported image/PDF types. Files in the portfolio bucket are publicly readable, so upload only materials you are ready to publish. Empty fields stay hidden from visitors. There is no fake contact form.
- Edit colors and spacing near the top of `css/style.css`, where the shared CSS variables are defined.
- Change the network artwork by editing `assets/research-network.svg` or replacing it with an image you have permission to use.

After changing a file, save it and refresh the browser. On GitHub Pages, allow a short time for the new commit to publish, then refresh the hosted page.

## Run the backend locally

This project targets Node 24. The workspace currently had Node 18 installed, which is end-of-life; install the Node version in `.node-version` before running the backend.

1. Create a free Supabase project.
2. In its SQL Editor, run `supabase/schema.sql`. The file creates one JSONB content row, an admin-membership table, a public-assets storage bucket, and row-level policies. The content is a single document because this portfolio has one owner and the editor saves a small, related set of fields together. Re-running the script is safe for the seeded content and policies.
3. In Supabase Auth, create your own user. Copy that user's UUID, then run the final `insert into public.portfolio_admins...` statement shown in the SQL file with your UUID.
4. Copy `.env.example` to `.env`. Add the project URL and **publishable key** from Supabase Project Settings → API Keys. Do not use a Supabase secret key or service-role key. Do not commit `.env` or paste credentials in chat.
5. Install dependencies with `npm install`, then run `npm run dev` in one terminal.
6. In another terminal, serve this folder with `python3 -m http.server 8000`.
7. Open `http://localhost:8000/admin.html`, sign in with the Supabase user, edit fields, upload a photo/image/PDF if desired, and select **Save portfolio content**. The file upload immediately sends the file to Supabase Storage; saving then publishes its link in the content record. Open `http://localhost:8000/` to see the public content.

The admin page uses the Supabase JavaScript client from jsDelivr for sign-in and direct file uploads. The backend uses Supabase's Data API with the user's access token and publishable key. Row-level security controls database reads, writes, and uploads; no privileged key is used by browser or server code. The API validates content as a second check. Supabase Storage serves files because Render's filesystem is temporary.

## Deploy the API

The static portfolio stays on GitHub Pages. The Node API runs separately on Render because Pages cannot run server-side code.

1. Create a Render account and use **New → Blueprint** to connect this repository. `render.yaml` describes the API service.
2. In the service's Environment settings, add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `ALLOWED_ORIGINS` (include the live Pages origin).
3. Deploy and open `/api/health` on the Render URL; it should return `{"status":"ok"}`.
4. Add the Render API URL to `js/backend-config.js` for non-local visitors, commit, and push. GitHub Pages will then load editable content through the API.
5. Open the live `/admin.html`, sign in, and save a small content change. Refresh the public page to confirm it appears.

## Free usage and file privacy

No paid plan or payment method is required for this learning setup. Keep each service on its Free plan and do not enter payment details or upgrade. Current Supabase Free includes 1 GB of file storage, and its platform maximum upload size is 50 MB; this app and its bucket set a stricter 15 MB maximum. Supported uploads are JPEG/PNG/WebP images and PDFs. Render Free web services sleep after 15 idle minutes and wake on the next request; Supabase may pause a free project after a week of low activity. Quotas and provider terms can change. If a free quota is reached, stop uploading and review usage instead of upgrading. [Supabase Free plan and storage](https://supabase.com/pricing), [Supabase upload limits](https://supabase.com/docs/guides/storage/uploads/file-limits), [Render Free limits](https://render.com/docs/free).

The `portfolio-assets` bucket is public so the public website can show images and link to papers without exposing a database secret. Its Storage policies permit public reads but restrict upload, update, and deletion to the approved admin. This means anyone with a file URL can view that file. Do not upload private manuscripts, personal records, credentials, or files you are not ready to publish. The managed database and storage keep data; do not store uploads on Render's temporary filesystem. Treat free hosting as a learning/demo environment, not a guaranteed always-available production service.

## Deploy to GitHub Pages

This project is already published from the public [`portfolio-website` repository](https://github.com/bishwa011/portfolio-website). Pages uses the `main` branch and `/ (root)` folder. `index.html` is the entry file, and the relative paths to `css/`, `js/`, and `assets/` work at the project's Pages URL.

For future edits:

1. Save your local changes.
2. Stage the files you changed, for example: `git add index.html css/style.css`.
3. Save a checkpoint with a clear message, for example: `git commit -m "Update portfolio introduction"`.
4. Send the commit to GitHub with `git push`.
5. GitHub Pages automatically publishes the updated static files. Check the Pages deployment status in the repository's **Actions** or **Settings → Pages** area if the site does not update.

On GitHub Free, the source repository and published site are public. Never put private information, passwords, or secrets in either one. The local `requirements.md` and `conversation.md` files are excluded from the public repository by `.gitignore`.

## Current limits and future improvements

The backend and admin editor are not ready for public use until a Supabase project and Render service are configured. The public page stays static until its API URL is set. GitHub Pages cannot run server-side code, so the API is a separate service. If this moves beyond a learning project, review the free-tier sleep/pause limits and upgrade or move hosts before relying on uptime.

Possible learning steps, when requested:

1. Finish account setup and connect the API to the published page.
2. Add preview/publish controls and edit audit history.
3. Normalize the content into separate relational tables if the site gains multiple editors, complex filtering, or relations.
4. Add dedicated research/project pages, visualizations, or a blog only when useful.
