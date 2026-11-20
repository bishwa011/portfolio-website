const apiBase = window.PORTFOLIO_API_BASE;
const loginPanel = document.querySelector("#login-panel");
const editorPanel = document.querySelector("#editor-panel");
const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");
const saveStatus = document.querySelector("#save-status");
const saveButton = document.querySelector("#save-button");

let authClient;
let accessToken = "";
let portfolio = null;

const collectionSettings = {
  research: {
    container: "#research-list",
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "areas", label: "Research areas (comma separated)", type: "tags" },
    ],
    empty: () => ({ id: crypto.randomUUID(), kind: "direction", title: "", description: "", areas: [] }),
  },
  publications: {
    container: "#publications-list",
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Publication status", type: "select", options: ["", "Published", "Under Review", "Ongoing"] },
      { key: "paperUrl", label: "Paper URL", type: "url" },
      { key: "doiUrl", label: "DOI URL", type: "url" },
      { key: "codeUrl", label: "Code URL", type: "url" },
      { key: "posterUrl", label: "Poster URL", type: "url" },
    ],
    empty: () => ({ id: crypto.randomUUID(), title: "", description: "", status: "", paperUrl: "", doiUrl: "", codeUrl: "", posterUrl: "" }),
  },
  projects: {
    container: "#projects-list",
    fields: [
      { key: "title", label: "Project name" },
      { key: "status", label: "Project status", type: "select", options: ["completed", "in_progress", "planned"] },
      { key: "description", label: "Purpose and description", type: "textarea" },
      { key: "year", label: "Year" },
      { key: "technologies", label: "Technologies (comma separated)", type: "tags" },
      { key: "repositoryUrl", label: "Repository URL", type: "url" },
      { key: "demoUrl", label: "Live demo URL", type: "url" },
    ],
    empty: () => ({ id: crypto.randomUUID(), title: "", status: "planned", description: "", year: "", technologies: [], repositoryUrl: "", demoUrl: "" }),
  },
  skills: {
    container: "#skills-list",
    fields: [
      { key: "category", label: "Category" },
      { key: "items", label: "Skills or methods (comma separated)", type: "tags", wide: true },
    ],
    empty: () => ({ id: crypto.randomUUID(), category: "", items: [] }),
  },
};

function showLogin(message = "") {
  loginPanel.hidden = false;
  editorPanel.hidden = true;
  loginStatus.textContent = message;
}

function showEditor() {
  loginPanel.hidden = true;
  editorPanel.hidden = false;
}

function parseList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function addField(parent, field, item, index, collection) {
  const label = document.createElement("label");
  label.textContent = field.label;
  const value = item[field.key];
  let input;

  if (field.type === "select") {
    input = document.createElement("select");
    for (const optionValue of field.options) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue || "Choose a status";
      input.append(option);
    }
    input.value = value || "";
  } else if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 3;
    input.value = value || "";
  } else {
    input = document.createElement("input");
    input.type = field.type === "url" ? "url" : "text";
    input.value = Array.isArray(value) ? value.join(", ") : value || "";
  }

  input.dataset.collection = collection;
  input.dataset.index = String(index);
  input.dataset.field = field.key;
  input.addEventListener("input", updateCollectionField);
  input.addEventListener("change", updateCollectionField);
  label.append(input);
  parent.append(label);
}

function renderCollection(name) {
  const settings = collectionSettings[name];
  const container = document.querySelector(settings.container);
  container.replaceChildren();

  portfolio[name].forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "admin-item";
    const heading = document.createElement("div");
    heading.className = "admin-item-header";
    const title = document.createElement("strong");
    title.textContent = item.title || item.category || `New ${name.slice(0, -1)} ${index + 1}`;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      portfolio[name].splice(index, 1);
      renderCollection(name);
    });
    heading.append(title, removeButton);

    const fields = document.createElement("div");
    fields.className = "admin-item-fields";
    for (const field of settings.fields) addField(fields, field, item, index, name);
    card.append(heading, fields);
    container.append(card);
  });
}

function updateCollectionField(event) {
  const input = event.currentTarget;
  const item = portfolio[input.dataset.collection][Number(input.dataset.index)];
  const field = input.dataset.field;
  const isListField = ["areas", "technologies", "items"].includes(field);
  item[field] = isListField ? parseList(input.value) : input.value;

  const heading = input.closest(".admin-item")?.querySelector(".admin-item-header strong");
  if (heading && (field === "title" || field === "category")) heading.textContent = input.value || `New ${input.dataset.collection.slice(0, -1)}`;
}

function populateEditor() {
  for (const input of document.querySelectorAll("[data-profile-field]")) {
    const value = portfolio.profile[input.dataset.profileField];
    input.value = input.dataset.profileField === "about" ? (value || []).join("\n\n") : value || "";
    input.addEventListener("input", () => {
      const field = input.dataset.profileField;
      portfolio.profile[field] = field === "about" ? input.value.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean) : input.value.trim();
    });
  }
  for (const input of document.querySelectorAll("[data-link-field]")) {
    input.value = portfolio.profile.links?.[input.dataset.linkField] || "";
    input.addEventListener("input", () => {
      portfolio.profile.links[input.dataset.linkField] = input.value.trim();
    });
  }
  for (const input of document.querySelectorAll("[data-learning-field]")) {
    input.value = portfolio.learning[input.dataset.learningField] || "";
    input.addEventListener("input", () => {
      portfolio.learning[input.dataset.learningField] = input.value.trim();
    });
  }
  for (const name of Object.keys(collectionSettings)) renderCollection(name);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

async function loadPortfolio() {
  const result = await apiRequest("/api/admin/content");
  portfolio = result.content;
  populateEditor();
  showEditor();
}

document.querySelectorAll("[data-add-item]").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.addItem;
    portfolio[name].push(collectionSettings[name].empty());
    renderCollection(name);
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Signing in…";
  const form = new FormData(loginForm);
  try {
    const { data, error } = await authClient.auth.signInWithPassword({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (error) throw error;
    accessToken = data.session.access_token;
    await loadPortfolio();
  } catch (error) {
    accessToken = "";
    showLogin(error.message || "Sign-in failed.");
  }
});

document.querySelector("#sign-out-button").addEventListener("click", async () => {
  if (authClient) await authClient.auth.signOut();
  accessToken = "";
  portfolio = null;
  loginForm.reset();
  showLogin("You are signed out.");
});

document.querySelector("#content-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  saveStatus.textContent = "Saving…";
  try {
    await apiRequest("/api/admin/content", {
      method: "PUT",
      body: JSON.stringify({ content: portfolio, published: true }),
    });
    saveStatus.textContent = "Saved. Refresh the public portfolio to see your changes.";
  } catch (error) {
    saveStatus.textContent = error.message;
    if (error.message.includes("Sign in") || error.message.includes("session expired")) showLogin(error.message);
  } finally {
    saveButton.disabled = false;
  }
});

async function initializeEditor() {
  if (!apiBase) {
    showLogin("The backend URL is not configured yet. See README.md → Backend setup.");
    loginForm.querySelectorAll("input, button").forEach((control) => { control.disabled = true; });
    return;
  }

  try {
    const config = await apiRequest("/api/config");
    authClient = window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch (error) {
    showLogin(error.message || "Could not connect to the backend.");
    loginForm.querySelectorAll("input, button").forEach((control) => { control.disabled = true; });
  }
}

initializeEditor();
