// The backend URL can be entered after the Render service is created.
// On localhost, the API runs at port 3000.
window.PORTFOLIO_API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "";
