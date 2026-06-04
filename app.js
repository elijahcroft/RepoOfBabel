import {
  LANGUAGE_DEFS,
  DEFAULT_ADDRESS,
  BOUNDS,
  buildAddressString,
  generateFile,
  sanitizeAddress,
  renderLinesInto,
} from "./generator.js";

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
};

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

  if (elements.addressString) elements.addressString.textContent = addressString;
  if (elements.seedValue) elements.seedValue.textContent = String(generated.seed);
  elements.subtitle.textContent = subtitle;
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
}

fillLanguageOptions();
bindEvents();
render(addressFromUrl());
