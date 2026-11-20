const apiBaseUrl = window.PORTFOLIO_API_BASE;

function create(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function safeHttpsUrl(value) {
  if (typeof value !== "string" || value.trim() === "") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function renderTags(items, label) {
  const list = create("ul", "tag-list");
  list.setAttribute("aria-label", label);
  for (const item of items || []) list.append(create("li", "", item));
  return list;
}

function renderProfile(profile) {
  const nameParts = profile.name.trim().split(/\s+/);
  const lastName = nameParts.pop() || "";
  const title = document.querySelector("#hero-title");
  title.replaceChildren(document.createTextNode(`${nameParts.join(" ")} `), create("span", "", lastName));

  const location = document.querySelector("#hero-location");
  location.replaceChildren(create("span", "status-dot"), document.createTextNode(` Graduate researcher · ${profile.location || ""}`));

  document.querySelector(".hero-lede").textContent = profile.tagline || "";
  const affiliation = document.querySelector(".hero-affiliation");
  affiliation.replaceChildren(document.createTextNode(profile.degree || ""), document.createElement("br"), document.createTextNode(profile.affiliation || ""));

  const about = document.querySelector("#about-copy");
  const contactLink = about.querySelector("a");
  about.querySelectorAll("p").forEach((paragraph) => paragraph.remove());
  profile.about.forEach((paragraph, index) => about.insertBefore(create("p", index === 0 ? "large-copy" : "", paragraph), contactLink));

  const photoUrl = safeHttpsUrl(profile.photoUrl);
  const photo = document.querySelector("#profile-photo");
  if (photoUrl) {
    const image = create("img");
    image.src = photoUrl;
    image.alt = `Portrait of ${profile.name}`;
    photo.replaceChildren(image);
    photo.removeAttribute("role");
    photo.removeAttribute("aria-label");
  } else {
    photo.replaceChildren(create("span", "", "BPS"));
    photo.setAttribute("role", "img");
    photo.setAttribute("aria-label", `Profile photo placeholder for ${profile.name}`);
  }

  const githubUrl = safeHttpsUrl(profile.links?.github);
  for (const id of ["hero-github-link", "contact-github-link"]) {
    const link = document.getElementById(id);
    if (githubUrl) link.href = githubUrl;
    else link.hidden = true;
  }

  const resumeUrl = safeHttpsUrl(profile.resumeUrl);
  const resumeLink = document.querySelector("#hero-resume-link");
  if (resumeUrl) {
    resumeLink.href = resumeUrl;
    resumeLink.textContent = "Résumé ↗";
    resumeLink.target = "_blank";
    resumeLink.rel = "noreferrer";
    resumeLink.hidden = false;
  } else {
    resumeLink.hidden = true;
  }

  const contacts = document.querySelector("#contact-list");
  contacts.replaceChildren();
  const contactItems = [
    ["GitHub", profile.links?.github, "GitHub profile"],
    ["Email", profile.email ? `mailto:${profile.email}` : "", profile.email || ""],
    ["LinkedIn", profile.links?.linkedin, "LinkedIn profile"],
    ["Google Scholar", profile.links?.scholar, "Google Scholar profile"],
    ["ORCID", profile.links?.orcid, "ORCID profile"],
    ["Résumé", resumeUrl, "View résumé"],
  ];
  for (const [label, href, description] of contactItems) {
    if (!href) continue;
    const row = create("li");
    row.append(create("span", "", label));
    const link = create("a", "contact-value", description);
    link.href = href.startsWith("mailto:") ? href : safeHttpsUrl(href);
    if (!href.startsWith("mailto:")) { link.target = "_blank"; link.rel = "noreferrer"; }
    row.append(link);
    contacts.append(row);
  }
  if (contacts.children.length === 0) {
    contacts.append(create("li", "contact-empty", "Contact links will be added here."));
  }
}

function renderResearch(research) {
  const directions = research.filter((item) => item.kind === "direction");
  const list = document.querySelector("#research-list");
  list.replaceChildren();
  directions.forEach((item, index) => {
    const card = create("article", `research-card${index === 0 ? " research-card-featured" : ""}`);
    const meta = create("div", "card-meta");
    meta.append(create("span", "", "Research direction"), create("span", "", String(index + 1).padStart(2, "0")));
    card.append(meta, create("h3", "", item.title), create("p", "", item.description), renderTags(item.areas, "Research areas"));
    list.append(card);
  });
}

function renderPublications(publications) {
  const container = document.querySelector("#publication-list");
  if (!publications.length) {
    container.className = "publication-note";
    container.replaceChildren(create("span", "note-mark", "i"));
    const message = create("p");
    const label = create("strong", "", "Publications");
    message.append(label, document.createTextNode(" — No citation details are listed yet. Add verified publication information in the editor when ready."));
    container.append(message);
    return;
  }

  container.className = "publication-grid";
  container.replaceChildren();
  for (const item of publications) {
    const card = create("article", "research-card");
    const meta = create("div", "card-meta");
    meta.append(create("span", "", "Publication"), create("span", "", item.status || "Status not provided"));
    card.append(meta, create("h3", "", item.title), create("p", "", item.description || ""));
    const links = create("div", "project-links");
    for (const [key, label] of [["paperUrl", "Paper"], ["doiUrl", "DOI"], ["codeUrl", "Code"], ["posterUrl", "Poster"]]) {
      const url = safeHttpsUrl(item[key]);
      if (!url) continue;
      const link = create("a", "text-link", `${label} ↗`);
      link.href = url; link.target = "_blank"; link.rel = "noreferrer";
      links.append(link);
    }
    if (links.children.length) card.append(links);
    container.append(card);
  }
}

function renderProjects(projects) {
  const container = document.querySelector("#project-list");
  container.replaceChildren();
  projects.forEach((project) => {
    const card = create("article", "project-card");
    const preview = create("div", "project-preview");
    preview.setAttribute("aria-hidden", "true");
    const imageUrl = safeHttpsUrl(project.imageUrl);
    if (imageUrl) {
      const image = create("img");
      image.src = imageUrl;
      image.alt = "";
      preview.append(image);
    } else {
      preview.append(create("span", "project-preview-mark", project.title.slice(0, 2).toUpperCase()));
    }
    const details = create("div", "project-details");
    const meta = create("div", "card-meta");
    const status = { completed: "Completed project", in_progress: "In progress", planned: "Planned" }[project.status] || "Project";
    meta.append(create("span", "", status), create("span", "", project.year || ""));
    details.append(meta, create("h3", "", project.title), create("p", "", project.description), renderTags(project.technologies, "Technologies used"));
    const links = create("div", "project-links");
    for (const [key, label] of [["repositoryUrl", "Source code"], ["demoUrl", "Live demo"]]) {
      const url = safeHttpsUrl(project[key]);
      if (!url) continue;
      const link = create("a", "text-link", `${label} ↗`);
      link.href = url; link.target = "_blank"; link.rel = "noreferrer";
      links.append(link);
    }
    if (links.children.length) details.append(links);
    card.append(preview, details);
    container.append(card);
  });
}

function renderSkills(groups) {
  const list = document.querySelector("#skills-list");
  list.replaceChildren();
  groups.forEach((group, index) => {
    const row = create("article", "skill-group");
    row.append(create("span", "skill-number", String(index + 1).padStart(2, "0")));
    const details = create("div");
    details.append(create("h3", "", group.category), create("p", "", (group.items || []).join(", ")));
    row.append(details);
    list.append(row);
  });
}

async function loadDynamicContent() {
  if (!apiBaseUrl) return;
  try {
    const response = await fetch(`${apiBaseUrl}/api/content`);
    if (!response.ok) return;
    const content = await response.json();
    renderProfile(content.profile);
    renderResearch(content.research);
    renderPublications(content.publications);
    renderProjects(content.projects);
    renderSkills(content.skills);
    document.querySelector("#learning-intro").textContent = content.learning.intro || "";
    document.querySelector("#learning-current").textContent = content.learning.currentFocus || "";
    document.querySelector("#learning-future").textContent = content.learning.nextExperiments || "";
  } catch (error) {
    console.info("Portfolio API is not available; showing the static page content.", error);
  }
}

loadDynamicContent();
