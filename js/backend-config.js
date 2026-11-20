// Use the local API during development and the deployed API on the public site.
window.PORTFOLIO_API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://bishwa-portfolio-api.onrender.com";
