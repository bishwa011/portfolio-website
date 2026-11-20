import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT || 3000);
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "http://localhost:8000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use((request, response, next) => {
  response.set("X-Content-Type-Options", "nosniff");
  response.set("Referrer-Policy", "no-referrer");
  response.set("Cache-Control", "no-store");

  const origin = request.get("Origin");
  if (origin && allowedOrigins.has(origin)) {
    response.set("Access-Control-Allow-Origin", origin);
    response.set("Vary", "Origin");
    response.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  }

  if (request.method === "OPTIONS") {
    return response.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
  }
  next();
});

function requireSupabase(response) {
  if (supabaseUrl && publishableKey) return true;
  response.status(503).json({ error: "The backend needs its Supabase settings." });
  return false;
}

async function supabaseRequest(path, { token, method = "GET", body } = {}) {
  const headers = {
    apikey: publishableKey,
    "Content-Type": "application/json",
  };
  if (method === "PATCH") headers.Prefer = "return=representation";
  if (token) headers.Authorization = `Bearer ${token}`;

  const result = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const resultText = await result.text();
  let data = null;
  try {
    data = resultText ? JSON.parse(resultText) : null;
  } catch {
    data = { message: "Supabase returned an unexpected response." };
  }

  if (!result.ok) {
    const error = new Error(data?.message || data?.msg || "Supabase request failed.");
    error.status = result.status;
    throw error;
  }
  return data;
}

function validateContent(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return "Content must be an object.";
  }
  const { profile, research, publications, projects, skills, learning } = content;
  if (!profile || !Array.isArray(research) || !Array.isArray(publications) ||
      !Array.isArray(projects) || !Array.isArray(skills) || !learning) {
    return "Content is missing a profile, list, or learning section.";
  }
  if (research.length > 40 || publications.length > 80 || projects.length > 80 || skills.length > 30) {
    return "A content section has too many entries.";
  }

  const textWithinLimit = (value, limit) => typeof value === "string" && value.length <= limit;
  const safeUrl = (value) => {
    if (value === "" || value == null) return true;
    if (typeof value !== "string" || value.length > 500) return false;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  };
  if (!textWithinLimit(profile.name, 120) || !textWithinLimit(profile.tagline, 500) ||
      !textWithinLimit(profile.location || "", 160) || !textWithinLimit(profile.degree || "", 200) ||
      !textWithinLimit(profile.affiliation || "", 200) ||
      !Array.isArray(profile.about) || profile.about.length > 10 ||
      profile.about.some((paragraph) => !textWithinLimit(paragraph, 2000))) {
    return "Check the name, introduction, and about text lengths.";
  }
  if (!safeUrl(profile.photoUrl) || !safeUrl(profile.resumeUrl) ||
      !profile.links || typeof profile.links !== "object" || Array.isArray(profile.links) ||
      Object.values(profile.links).some((value) => !safeUrl(value))) {
    return "Profile and social links must use https:// URLs.";
  }
  if (profile.email && (typeof profile.email !== "string" || profile.email.length > 254 || !profile.email.includes("@"))) {
    return "Enter a valid email address or leave it empty.";
  }
  for (const list of [research, publications, projects, skills]) {
    if (list.some((item) => !item || typeof item !== "object" || !textWithinLimit(item.title || item.category, 180))) {
      return "Each research, publication, project, or skill entry needs a short title.";
    }
  }
  if (research.some((item) => item.kind !== "direction" || !textWithinLimit(item.description || "", 2000) ||
      !Array.isArray(item.areas) || item.areas.some((area) => !textWithinLimit(area, 100)))) {
    return "Check research direction descriptions and area tags.";
  }
  const publicationStatuses = new Set(["", "Published", "Under Review", "Ongoing"]);
  if (publications.some((item) => !textWithinLimit(item.description || "", 2000) ||
      !publicationStatuses.has(item.status || "") ||
      [item.paperUrl, item.doiUrl, item.codeUrl, item.posterUrl].some((url) => !safeUrl(url)))) {
    return "Check publication status and links.";
  }
  const projectStatuses = new Set(["completed", "in_progress", "planned"]);
  if (projects.some((item) => !textWithinLimit(item.description || "", 2000) ||
      !projectStatuses.has(item.status) || !Array.isArray(item.technologies) ||
      item.technologies.some((technology) => !textWithinLimit(technology, 100)) ||
      !safeUrl(item.repositoryUrl) || !safeUrl(item.demoUrl))) {
    return "Check project descriptions, status, technologies, and links.";
  }
  if (skills.some((item) => !textWithinLimit(item.category, 120) || !Array.isArray(item.items) ||
      item.items.some((skill) => !textWithinLimit(skill, 160)))) {
    return "Check the skill categories and items.";
  }
  if (!learning || ![learning.intro, learning.currentFocus, learning.nextExperiments]
      .every((value) => textWithinLimit(value || "", 1500))) {
    return "Check the learning section text.";
  }
  return null;
}

async function requireAdmin(request, response, next) {
  if (!requireSupabase(response)) return;
  const token = request.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return response.status(401).json({ error: "Sign in to use the editor." });

  try {
    const user = await supabaseRequest("/auth/v1/user", { token });
    const admins = await supabaseRequest(
      `/rest/v1/portfolio_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { token },
    );
    if (!Array.isArray(admins) || admins.length !== 1) {
      return response.status(403).json({ error: "This account does not have portfolio editor access." });
    }
    request.user = user;
    request.accessToken = token;
    next();
  } catch (error) {
    response.status(error.status === 401 ? 401 : 502).json({
      error: error.status === 401 ? "Your session expired. Sign in again." : "Could not verify editor access.",
    });
  }
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

// These two values are public Supabase client settings. Database access is limited by RLS.
app.get("/api/config", (_request, response) => {
  if (!requireSupabase(response)) return;
  response.json({ supabaseUrl, publishableKey });
});

app.get("/api/content", async (_request, response) => {
  if (!requireSupabase(response)) return;
  try {
    const rows = await supabaseRequest("/rest/v1/portfolio_content?select=content,published&id=eq.1&limit=1");
    if (!rows?.length || !rows[0].published) return response.status(404).json({ error: "Portfolio content is not published." });
    response.json(rows[0].content);
  } catch {
    response.status(502).json({ error: "Could not load portfolio content." });
  }
});

app.get("/api/admin/content", requireAdmin, async (request, response) => {
  try {
    const rows = await supabaseRequest("/rest/v1/portfolio_content?select=content,published&id=eq.1&limit=1", { token: request.accessToken });
    if (!rows?.length) return response.status(404).json({ error: "Portfolio content has not been initialized." });
    response.json(rows[0]);
  } catch {
    response.status(502).json({ error: "Could not load editable content." });
  }
});

app.put("/api/admin/content", requireAdmin, async (request, response) => {
  const validationError = validateContent(request.body?.content);
  if (validationError) return response.status(400).json({ error: validationError });

  try {
    const rows = await supabaseRequest("/rest/v1/portfolio_content?id=eq.1", {
      token: request.accessToken,
      method: "PATCH",
      body: { content: request.body.content, published: request.body.published !== false, updated_at: new Date().toISOString() },
    });
    if (!rows?.length) return response.status(403).json({ error: "The database did not permit this update." });
    response.json({ saved: true, updatedAt: rows[0].updated_at });
  } catch (error) {
    response.status(error.status === 401 ? 401 : 502).json({ error: "Could not save portfolio content." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Portfolio API listening on port ${port}`);
});
