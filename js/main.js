const menuToggle = document.querySelector("#menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");
const currentYear = document.querySelector("#current-year");

// Keep navigation links visible without JavaScript; collapse them only after this script starts.
document.body.classList.add("js-ready");
primaryNavigation.classList.add("is-collapsed");

function closeMenu() {
  primaryNavigation.classList.add("is-collapsed");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
  const willOpen = primaryNavigation.classList.contains("is-collapsed");
  primaryNavigation.classList.toggle("is-collapsed", !willOpen);
  menuToggle.setAttribute("aria-expanded", String(willOpen));
});

primaryNavigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !primaryNavigation.classList.contains("is-collapsed")) {
    closeMenu();
    menuToggle.focus();
  }
});

currentYear.textContent = new Date().getFullYear();
