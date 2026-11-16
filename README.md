# Bishwa Prakash Subedi — Portfolio

A responsive personal portfolio for presenting graduate research, technical interests, and hands-on projects. Version 1 is a static website made with HTML, CSS, and vanilla JavaScript. It needs no installation, build step, framework, or server.

## Project structure

```text
portfolio-website/
├── index.html                  # Page content, metadata, and section structure
├── css/
│   └── style.css                # Colors, layout, responsive design, and focus styles
├── js/
│   └── main.js                  # Mobile navigation and current year
├── assets/
│   └── research-network.svg     # Local illustration used in the home section
├── requirements.md              # Local project scope and learning roadmap
├── conversation.md              # Local decisions and learning notes
└── .gitignore                   # Keeps the two learning notes out of the public repo
```

The content is written directly in `index.html` so it is easy to find and change. The stylesheet controls presentation without changing the meaning of the page. The small JavaScript file only adds the collapsible mobile menu and updates the copyright year.

`requirements.md` and `conversation.md` are kept in the local learning folder and excluded from the public website repository.

## Technologies

- HTML5 with semantic sections and accessible labels
- CSS3 with responsive layouts and reduced-motion support
- Vanilla JavaScript, with no external libraries or APIs
- Local SVG artwork

## Run locally

1. Open the `portfolio-website` folder.
2. Open `index.html` in a browser.

No local server is required. For a more realistic local web address, a simple static file server can be used later, but it is optional for this project.

## Customize the content

Open `index.html` in a text editor and search for `TODO` or the placeholder text.

- Replace the profile-photo placeholder with a real image only when you choose one to publish. Put it under `assets/` and update the About section.
- Add verified publication titles, exact statuses, and paper/DOI links in the Research section. The current cards are research directions, not publication claims.
- Add projects with accurate descriptions and working repository/demo links. Label unfinished work as in progress.
- Add only technologies and methods you can support from your experience.
- Replace the email, LinkedIn, Google Scholar, ORCID, and résumé placeholders when you are ready to publish those details. There is no fake contact form.
- Edit colors and spacing near the top of `css/style.css`, where the shared CSS variables are defined.
- Change the network artwork by editing `assets/research-network.svg` or replacing it with an image you have permission to use.

After changing a file, save it and refresh the browser. On GitHub Pages, allow a short time for the new commit to publish, then refresh the hosted page.

## Deploy to GitHub Pages

The source folder must be placed in a GitHub repository before Pages can publish it. On GitHub Free, the repository must be public, and the published page is public.

1. Create a new GitHub repository for this project. A repository named `bishwa011.github.io` can use the root account address; another name will use a project URL such as `https://bishwa011.github.io/portfolio-website/`.
2. Add the contents of this folder to the repository. Keep `index.html` at the repository root. Keep `css/`, `js/`, and `assets/` beside it; the site uses relative paths for these files.
3. Push the files to the repository's `main` branch.
4. In GitHub, open the repository's **Settings → Pages**.
5. Under the build and deployment source, select **Deploy from a branch**, choose `main` and the `/ (root)` folder, then save.
6. Wait for the Pages deployment to finish. The Pages settings page will show the published site link.

For future edits, save the changes, commit them, and push to `main`; Pages will publish the updated static files. Never put private information, passwords, or secrets in a public repository or website.

## Current limits and future improvements

This version does not have a server, database, dynamic publishing system, authentication, or working email form. GitHub Pages hosts static files and cannot run backend code. If the portfolio later needs a blog editor, saved user data, or other server-side behavior, the frontend can be carried forward while we add a backend and move deployment to a host that supports it.

Possible learning steps, when requested:

1. Add a research/project filter or dedicated detail pages using vanilla JavaScript.
2. Practice more JavaScript before considering React.
3. Introduce a backend API and database for genuinely dynamic features.
4. Add research visualizations, a blog, demos, or an admin interface as separate, deliberate projects.
