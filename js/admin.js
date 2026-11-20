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
      { key: "paperUrl", label: "Paper URL", type: "url", uploadAccept: "application/pdf", uploadLabel: "Upload paper PDF", pathGroup: "papers" },
      { key: "doiUrl", label: "DOI URL", type: "url" },
      { key: "codeUrl", label: "Code URL", type: "url" },
      { key: "posterUrl", label: "Poster URL", type: "url", uploadAccept: "application/pdf,image/jpeg,image/png,image/webp", uploadLabel: "Upload poster PDF or image", pathGroup: "posters" },
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
      { key: "imageUrl", label: "Project image URL", type: "url", uploadAccept: "image/jpeg,image/png,image/webp", uploadLabel: "Upload project image", pathGroup: "projects" },
      { key: "technologies", label: "Technologies (comma separated)", type: "tags" },
      { key: "repositoryUrl", label: "Repository URL", type: "url" },
      { key: "demoUrl", label: "Live demo URL", type: "url" },
    ],
    empty: () => ({ id: crypto.randomUUID(), title: "", status: "planned", description: "", year: "", imageUrl: "", technologies: [], repositoryUrl: "", demoUrl: "" }),
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

  if (!field.uploadAccept) {
    const label = document.createElement("label");
    label.textContent = field.label;
    label.append(input);
    parent.append(label);
    return;
  }

  const group = document.createElement("div");
  group.className = "admin-upload-field";
  const urlLabel = document.createElement("label");
  urlLabel.textContent = field.label;
  urlLabel.append(input);
  const fileLabel = document.createElement("label");
  fileLabel.className = "upload-control";
  fileLabel.append(document.createTextNode(field.uploadLabel));
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = field.uploadAccept;
  fileInput.dataset.uploadCollection = collection;
  fileInput.dataset.uploadIndex = String(index);
  fileInput.dataset.uploadTarget = field.key;
  fileInput.dataset.uploadPathGroup = field.pathGroup;
  fileInput.addEventListener("change", uploadPortfolioFile);
  fileLabel.append(fileInput);
  const status = document.createElement("small");
  status.className = "upload-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Choose a PDF or image; maximum 15 MB. Uploaded files are public.";
  group.append(urlLabel, fileLabel, status);
  parent.append(group);
}

async function uploadPortfolioFile(event) {
  const fileInput = event.currentTarget;
  const file = fileInput.files?.[0];
  if (!file) return;
  const statusContainer = fileInput.dataset.uploadCollection
    ? fileInput.closest(".admin-upload-field")
    : fileInput.closest("label");
  const status = statusContainer?.querySelector(".upload-status");
  const maxBytes = 15 * 1024 * 1024;
  const acceptedTypes = fileInput.accept.split(",");
  if (!acceptedTypes.includes(file.type)) {
    status.textContent = "This file type is not supported. Choose one of the listed types.";
    fileInput.value = "";
    return;
  }
  if (file.size > maxBytes) {
    status.textContent = "This file is larger than 15 MB. Choose a smaller file.";
    fileInput.value = "";
    return;
  }

  fileInput.disabled = true;
  status.textContent = "Uploading file…";
  try {
    const { data: sessionResult } = await authClient.auth.getSession();
    const userId = sessionResult.session?.user.id;
    if (!userId) throw new Error("Your session expired. Sign in again.");

    const extension = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
    const path = `${userId}/${fileInput.dataset.uploadPathGroup}/${crypto.randomUUID()}.${extension}`;
    const { error } = await authClient.storage.from("portfolio-assets").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = authClient.storage.from("portfolio-assets").getPublicUrl(path);
    const url = data.publicUrl;
    const collection = fileInput.dataset.uploadCollection;
    if (collection) {
      const item = portfolio[collection][Number(fileInput.dataset.uploadIndex)];
      item[fileInput.dataset.uploadTarget] = url;
      const itemCard = fileInput.closest(".admin-item");
      const urlField = [...itemCard.querySelectorAll("[data-field]")]
        .find((control) => control.dataset.field === fileInput.dataset.uploadTarget);
      urlField.value = url;
    } else {
      const field = fileInput.dataset.uploadProfile;
      portfolio.profile[field] = url;
      document.querySelector(`[data-profile-field="${field}"]`).value = url;
    }
    status.textContent = "Uploaded. Save portfolio content to publish this link.";
  } catch (error) {
    status.textContent = error.message || "Upload failed. Check your connection and file type.";
  } finally {
    fileInput.disabled = false;
    fileInput.value = "";
  }
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

document.querySelectorAll("[data-upload-profile]").forEach((input) => {
  input.dataset.uploadTarget = input.dataset.uploadProfile;
  input.dataset.uploadPathGroup ||= "profile";
  input.addEventListener("change", uploadPortfolioFile);
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
