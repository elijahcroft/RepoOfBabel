const STORAGE_KEY = "babel-theme";
const root = document.documentElement;

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    const icon = btn.querySelector(".theme-toggle-icon");
    const label = btn.querySelector(".theme-toggle-label");
    if (icon) icon.textContent = theme === "dark" ? "☀" : "☽";
    if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
  }
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  applyTheme(saved ?? getSystemTheme());
}

function toggleTheme() {
  const current = root.getAttribute("data-theme") ?? getSystemTheme();
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
}

initTheme();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    btn.addEventListener("click", toggleTheme);
    applyTheme(root.getAttribute("data-theme") ?? getSystemTheme());
  }
});
