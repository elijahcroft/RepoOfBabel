import {
  LANGUAGE_DEFS,
  DEFAULT_ADDRESS,
  BOUNDS,
  buildAddressString,
  generateFile,
  sanitizeAddress,
  renderLinesInto,
  linesToSource,
} from "./generator.js";
import { runCode, needsRuntimeLoad } from "./runner.js";

const elements = {
  form: document.querySelector("#address-form"),
  repo: document.querySelector("#repo-input"),
  branch: document.querySelector("#branch-input"),
  folder: document.querySelector("#folder-input"),
  file: document.querySelector("#file-input"),
  lang: document.querySelector("#lang-input"),
  addressString: document.querySelector("#address-string"),
  seedValue: document.querySelector("#seed-value"),
  subtitle: document.querySelector("#viewer-subtitle"),
  codeViewer: document.querySelector("#code-viewer"),
  navButtons: Array.from(document.querySelectorAll("[data-nav]")),
  copyLink: document.querySelector("#copy-link"),
  runBtn: document.querySelector("#run-btn"),
  runStatus: document.querySelector("#run-status"),
  terminal: document.querySelector("#terminal"),
  terminalWrap: document.querySelector("#terminal-wrap"),
  splitView: document.querySelector("#split-view"),
};

let currentSource = "";

function addressFromUrl() {
  const params = new URLSearchParams(window.location.search);
  // Legacy library terms (room/shelf/book/page) are still accepted on read and
  // rewritten to the GitHub-style scheme: room->repo, shelf->branch,
  // book->folder, page->file.
  return sanitizeAddress({
    repo: params.get("repo") ?? params.get("room"),
    branch: params.get("branch") ?? params.get("shelf"),
    folder: params.get("folder") ?? params.get("book"),
    file: params.get("file") ?? params.get("page"),
    lang: params.get("lang"),
  });
}

function writeAddressToUrl(address) {
  const params = new URLSearchParams({
    repo: String(address.repo),
    branch: String(address.branch),
    folder: String(address.folder),
    file: String(address.file),
    lang: address.lang,
  });
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
}

function fillLanguageOptions() {
  Object.entries(LANGUAGE_DEFS).forEach(([value, def]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = def.label;
    elements.lang.append(option);
  });
}

function setFormValues(address) {
  // Don't overwrite the field the user is actively typing in, or clamping
  // and defaulting would fight them mid-edit (e.g. clearing a field would
  // snap it back to a default value).
  const active = document.activeElement;
  const assign = (element, value) => {
    if (element !== active) {
      element.value = String(value);
    }
  };

  assign(elements.repo, address.repo);
  assign(elements.branch, address.branch);
  assign(elements.folder, address.folder);
  assign(elements.file, address.file);
  assign(elements.lang, address.lang);
}

function render(address) {
  const generated = generateFile(address);
  const addressString = buildAddressString(address);
  const subtitle = `repo ${address.repo} / branch ${address.branch} / folder ${address.folder} / file ${address.file} · ${LANGUAGE_DEFS[address.lang].label}`;

  setFormValues(address);
  writeAddressToUrl(address);
  renderLinesInto(elements.codeViewer, generated.lines);
  currentSource = linesToSource(generated.lines);

  if (elements.addressString) elements.addressString.textContent = addressString;
  if (elements.seedValue) elements.seedValue.textContent = String(generated.seed);
  elements.subtitle.textContent = subtitle;

  // Reset terminal when address changes.
  if (elements.terminalWrap) {
    elements.terminalWrap.hidden = true;
    elements.terminal.innerHTML = "";
    elements.runStatus.textContent = "";
    elements.runBtn.disabled = false;
    elements.splitView.classList.remove("has-output");
  }
}

async function runCurrentFile() {
  elements.runBtn.disabled = true;
  elements.runStatus.textContent = needsRuntimeLoad(readFormAddress().lang) ? "Loading runtime…" : "Running…";

  const result = await runCode(readFormAddress().lang, currentSource);

  elements.terminal.innerHTML = "";
  if (result.stdout) {
    const s = document.createElement("span");
    s.textContent = result.stdout;
    elements.terminal.append(s);
  }
  if (result.stderr) {
    const s = document.createElement("span");
    s.className = "stderr";
    s.textContent = (result.stdout ? "\n" : "") + result.stderr;
    elements.terminal.append(s);
  }
  if (!result.stdout && !result.stderr) {
    const s = document.createElement("span");
    s.className = "term-empty";
    s.textContent = "(no output)";
    elements.terminal.append(s);
  }

  elements.terminalWrap.hidden = false;
  elements.splitView.classList.add("has-output");
  elements.runStatus.textContent = result.timedOut
    ? "timed out"
    : result.ok ? `exit ok · ${result.durationMs}ms` : `error · ${result.durationMs}ms`;
  elements.runBtn.disabled = false;
}

function readFormAddress() {
  return sanitizeAddress({
    repo: elements.repo.value,
    branch: elements.branch.value,
    folder: elements.folder.value,
    file: elements.file.value,
    lang: elements.lang.value,
  });
}

function stepAddress(address, direction) {
  const next = { ...address };

  switch (direction) {
    case "prev-file":
      if (address.file > BOUNDS.file.min) {
        next.file = address.file - 1;
      } else {
        next.file = BOUNDS.file.max;

        if (address.folder > BOUNDS.folder.min) {
          next.folder = address.folder - 1;
        } else {
          next.folder = BOUNDS.folder.max;

          if (address.branch > BOUNDS.branch.min) {
            next.branch = address.branch - 1;
          } else {
            next.branch = BOUNDS.branch.max;
            next.repo = Math.max(BOUNDS.repo.min, address.repo - 1);
          }
        }
      }
      break;
    case "next-file":
      if (address.file < BOUNDS.file.max) {
        next.file = address.file + 1;
      } else {
        next.file = BOUNDS.file.min;

        if (address.folder < BOUNDS.folder.max) {
          next.folder = address.folder + 1;
        } else {
          next.folder = BOUNDS.folder.min;

          if (address.branch < BOUNDS.branch.max) {
            next.branch = address.branch + 1;
          } else {
            next.branch = BOUNDS.branch.min;
            next.repo = address.repo + 1;
          }
        }
      }
      break;
    case "prev-folder":
      if (address.folder > BOUNDS.folder.min) {
        next.folder = address.folder - 1;
      } else {
        next.folder = BOUNDS.folder.max;

        if (address.branch > BOUNDS.branch.min) {
          next.branch = address.branch - 1;
        } else {
          next.branch = BOUNDS.branch.max;
          next.repo = Math.max(BOUNDS.repo.min, address.repo - 1);
        }
      }
      break;
    case "next-folder":
      if (address.folder < BOUNDS.folder.max) {
        next.folder = address.folder + 1;
      } else {
        next.folder = BOUNDS.folder.min;

        if (address.branch < BOUNDS.branch.max) {
          next.branch = address.branch + 1;
        } else {
          next.branch = BOUNDS.branch.min;
          next.repo = address.repo + 1;
        }
      }
      break;
    case "prev-branch":
      if (address.branch > BOUNDS.branch.min) {
        next.branch = address.branch - 1;
      } else {
        next.branch = BOUNDS.branch.max;
        next.repo = Math.max(BOUNDS.repo.min, address.repo - 1);
      }
      break;
    case "next-branch":
      if (address.branch < BOUNDS.branch.max) {
        next.branch = address.branch + 1;
      } else {
        next.branch = BOUNDS.branch.min;
        next.repo = address.repo + 1;
      }
      break;
    case "prev-repo":
      next.repo = Math.max(BOUNDS.repo.min, address.repo - 1);
      break;
    case "next-repo":
      next.repo = address.repo + 1;
      break;
    case "random":
      next.repo = 1 + Math.floor(Math.random() * 1000000);
      next.branch = 1 + Math.floor(Math.random() * BOUNDS.branch.max);
      next.folder = 1 + Math.floor(Math.random() * BOUNDS.folder.max);
      next.file = 1 + Math.floor(Math.random() * BOUNDS.file.max);
      next.lang = Object.keys(LANGUAGE_DEFS)[Math.floor(Math.random() * Object.keys(LANGUAGE_DEFS).length)];
      break;
    default:
      return address;
  }

  return sanitizeAddress(next);
}

function bindEvents() {
  elements.form.addEventListener("input", () => {
    render(readFormAddress());
  });

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.nav;
      render(stepAddress(readFormAddress(), direction));
    });
  });

  elements.copyLink.addEventListener("click", async () => {
    const url = window.location.href;
    const original = elements.copyLink.textContent;

    try {
      await navigator.clipboard.writeText(url);
      elements.copyLink.textContent = "Copied!";
    } catch (error) {
      elements.copyLink.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      elements.copyLink.textContent = original;
    }, 1400);
  });

  window.addEventListener("popstate", () => {
    render(addressFromUrl());
  });

  elements.runBtn?.addEventListener("click", runCurrentFile);
}

fillLanguageOptions();
bindEvents();
render(addressFromUrl());

const wrap = document.getElementById("code-viewer-wrap");
window.addEventListener("scroll", () => {
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 40;
  wrap.classList.toggle("at-bottom", atBottom);
});
