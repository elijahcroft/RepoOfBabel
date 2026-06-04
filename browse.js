import {
  LANGUAGE_DEFS,
  BOUNDS,
  generateFile,
  sanitizeAddress,
  renderLinesInto,
  buildCoordinate,
} from "./generator.js";

// Browse mimics GitHub. You start at the repo layer (an "explore" grid of
// repositories) and descend: repo → folder → file, each step styled like the
// matching GitHub surface (repo cards, file-listing table, blob view).
const LEVELS = ["repos", "repo", "folder", "view"];
const REPOS_PER_PAGE = 12;

const OWNER = "babel";
const EXTENSIONS = { python: "py", javascript: "js" };
const LANG_COLORS = { python: "#3572A5", javascript: "#f1e05a" };

const ADJECTIVES = ["swift", "lunar", "crimson", "hidden", "quantum", "silent", "golden", "fractal", "velvet", "north", "ember", "arcane", "cobalt", "frost", "nimbus", "drift"];
const NOUNS = ["engine", "forge", "atlas", "cipher", "harbor", "lattice", "pixel", "beacon", "syntax", "vector", "cascade", "relay", "ledger", "spindle", "oracle", "canvas"];
const DESCRIPTIONS = [
  "Deterministic source generated from its coordinate.",
  "Every line discovered, never written.",
  "A repository that has always existed.",
  "Generated on read — identical every time.",
  "One of infinitely many possible repos.",
  "Source conjured from a single seed.",
];

const ICONS = {
  repo: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>',
  folder: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#54aeff" d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>',
  file: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#6e7781" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>',
  star: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>',
  branch: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path></svg>',
};

const elements = {
  lang: document.querySelector("#lang-input"),
  breadcrumb: document.querySelector("#breadcrumb"),
  actions: document.querySelector("#context-actions"),
  grid: document.querySelector("#browse-grid"),
  fileView: document.querySelector("#file-view"),
  blobHead: document.querySelector("#blob-head"),
  fileCode: document.querySelector("#file-code"),
};

const state = {
  repo: 1,
  branch: 1,
  folder: 1,
  file: 1,
  lang: "python",
  level: "repos",
  page: 0,
};

// A tiny deterministic RNG so a repo always renders the same name/metadata.
function seeded(n) {
  let s = (Math.imul(n, 2654435761) ^ 0x9e3779b9) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function repoMeta(n) {
  const rng = seeded(n);
  const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)];
  const description = DESCRIPTIONS[Math.floor(rng() * DESCRIPTIONS.length)];
  const stars = Math.floor(rng() * 9000);
  const updatedDays = 1 + Math.floor(rng() * 900);
  return { name: `${adj}-${noun}`, description, stars, updatedDays };
}

function branchLabel(n) {
  return n === 1 ? "main" : `branch-${n}`;
}

function relativeTime(days) {
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function formatStars(stars) {
  return stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars);
}

function commitMessage(seed) {
  const messages = ["update generated source", "refactor module", "tidy imports", "initial commit", "fix edge case", "add notes", "rework internals", "tweak constants"];
  return messages[seed % messages.length];
}

function setLevel(level) {
  state.level = level;
}

function stateToUrl() {
  const params = new URLSearchParams({ lang: state.lang, level: state.level });
  const depth = LEVELS.indexOf(state.level);

  if (state.level === "repos") params.set("page", String(state.page));
  if (depth >= 1) {
    params.set("repo", String(state.repo));
    params.set("branch", String(state.branch));
  }
  if (depth >= 2) params.set("folder", String(state.folder));
  if (state.level === "view") params.set("file", String(state.file));

  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function readUrl() {
  const params = new URLSearchParams(window.location.search);
  const lang = LANGUAGE_DEFS[params.get("lang")] ? params.get("lang") : "python";
  const level = LEVELS.includes(params.get("level")) ? params.get("level") : "repos";

  const safe = sanitizeAddress({
    repo: params.get("repo"),
    branch: params.get("branch"),
    folder: params.get("folder"),
    file: params.get("file"),
    lang,
  });

  Object.assign(state, safe, {
    level,
    page: Math.max(0, Number(params.get("page")) || 0),
  });
}

function fillLanguageOptions() {
  Object.entries(LANGUAGE_DEFS).forEach(([value, def]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = def.label;
    elements.lang.append(option);
  });
  elements.lang.value = state.lang;
}

function crumbButton(label, onClick, current = false) {
  const node = document.createElement(current ? "span" : "button");
  node.className = current ? "ghcrumb ghcrumb-current" : "ghcrumb";
  node.textContent = label;
  if (!current) {
    node.type = "button";
    node.addEventListener("click", onClick);
  }
  return node;
}

function renderBreadcrumb() {
  elements.breadcrumb.innerHTML = "";
  const depth = LEVELS.indexOf(state.level);

  if (state.level === "repos") {
    const root = document.createElement("span");
    root.className = "ghcrumb-root";
    root.innerHTML = `${ICONS.repo}<span>Explore repositories</span>`;
    elements.breadcrumb.append(root);
    return;
  }

  const meta = repoMeta(state.repo);
  const owner = document.createElement("span");
  owner.className = "ghcrumb-owner";
  owner.innerHTML = `${ICONS.repo}<span>${OWNER} /</span>`;
  elements.breadcrumb.append(owner);

  const repoCrumb = crumbButton(meta.name, () => {
    setLevel("repo");
    render();
  }, state.level === "repo");
  repoCrumb.classList.add("ghcrumb-repo");
  elements.breadcrumb.append(repoCrumb);

  if (depth >= 2) {
    elements.breadcrumb.append(makeSep());
    elements.breadcrumb.append(
      crumbButton(`folder-${state.folder}`, () => {
        setLevel("folder");
        render();
      }, state.level === "folder"),
    );
  }

  if (state.level === "view") {
    elements.breadcrumb.append(makeSep());
    elements.breadcrumb.append(crumbButton(`file-${state.file}.${EXTENSIONS[state.lang]}`, null, true));
  }
}

function makeSep() {
  const sep = document.createElement("span");
  sep.className = "ghcrumb-sep";
  sep.textContent = "/";
  return sep;
}

function renderActions() {
  elements.actions.innerHTML = "";

  if (state.level === "repos") {
    const pager = document.createElement("div");
    pager.className = "gh-pager";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "gh-btn";
    prev.textContent = "‹ Prev";
    prev.disabled = state.page === 0;
    prev.addEventListener("click", () => {
      state.page = Math.max(0, state.page - 1);
      render();
    });

    const label = document.createElement("span");
    label.className = "gh-page-label";
    label.textContent = `repos ${state.page * REPOS_PER_PAGE + 1}–${(state.page + 1) * REPOS_PER_PAGE}`;

    const next = document.createElement("button");
    next.type = "button";
    next.className = "gh-btn";
    next.textContent = "Next ›";
    next.addEventListener("click", () => {
      state.page += 1;
      render();
    });

    pager.append(prev, label, next);
    elements.actions.append(pager);
    return;
  }

  // repo / folder / view all carry the branch picker, like GitHub's repo header.
  const wrap = document.createElement("label");
  wrap.className = "gh-branch";
  wrap.innerHTML = ICONS.branch;

  const select = document.createElement("select");
  select.className = "gh-branch-select";
  for (let b = BOUNDS.branch.min; b <= BOUNDS.branch.max; b += 1) {
    const opt = document.createElement("option");
    opt.value = String(b);
    opt.textContent = branchLabel(b);
    select.append(opt);
  }
  select.value = String(state.branch);
  select.addEventListener("change", () => {
    state.branch = Number(select.value);
    render();
  });

  wrap.append(select);
  elements.actions.append(wrap);

  const coord = document.createElement("span");
  coord.className = "gh-coord";
  coord.textContent = buildCoordinate(state);
  elements.actions.append(coord);
}

function langDot() {
  return `<span class="gh-lang-dot" style="background:${LANG_COLORS[state.lang]}"></span>${LANGUAGE_DEFS[state.lang].label}`;
}

// Repo layer: a GitHub-explore-style grid of repository cards.
function renderRepos() {
  elements.grid.className = "gh-body gh-repo-grid";
  elements.grid.innerHTML = "";

  const base = state.page * REPOS_PER_PAGE + 1;
  for (let i = 0; i < REPOS_PER_PAGE; i += 1) {
    const repo = base + i;
    const meta = repoMeta(repo);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "gh-repo-card";
    card.innerHTML = `
      <div class="gh-repo-title">${ICONS.repo}<span class="gh-repo-name">${OWNER} / ${meta.name}</span></div>
      <p class="gh-repo-desc">${meta.description}</p>
      <div class="gh-repo-meta">
        <span class="gh-repo-lang">${langDot()}</span>
        <span class="gh-repo-stars">${ICONS.star}${formatStars(meta.stars)}</span>
        <span class="gh-repo-updated">Updated ${relativeTime(meta.updatedDays)}</span>
      </div>`;
    card.addEventListener("click", () => {
      state.repo = repo;
      state.branch = 1;
      setLevel("repo");
      render();
    });
    elements.grid.append(card);
  }
}

function listRow({ icon, name, message, days, onClick }) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "gh-row";
  row.innerHTML = `
    <span class="gh-row-icon">${icon}</span>
    <span class="gh-row-name">${name}</span>
    <span class="gh-row-msg">${message}</span>
    <span class="gh-row-time">${relativeTime(days)}</span>`;
  row.addEventListener("click", onClick);
  return row;
}

// Repo view: GitHub file-listing table of this branch's folders.
function renderFolders() {
  elements.grid.className = "gh-body gh-listing";
  elements.grid.innerHTML = "";

  for (let folder = BOUNDS.folder.min; folder <= BOUNDS.folder.max; folder += 1) {
    const seed = generateFile(sanitizeAddress({ ...state, folder, file: 1 })).seed;
    elements.grid.append(
      listRow({
        icon: ICONS.folder,
        name: `folder-${folder}`,
        message: commitMessage(seed),
        days: 1 + (seed % 600),
        onClick: () => {
          state.folder = folder;
          setLevel("folder");
          render();
        },
      }),
    );
  }
}

// Folder view: GitHub file-listing table of files in this folder.
function renderFiles() {
  elements.grid.className = "gh-body gh-listing";
  elements.grid.innerHTML = "";

  for (let file = BOUNDS.file.min; file <= BOUNDS.file.max; file += 1) {
    const seed = generateFile(sanitizeAddress({ ...state, file })).seed;
    elements.grid.append(
      listRow({
        icon: ICONS.file,
        name: `file-${file}.${EXTENSIONS[state.lang]}`,
        message: commitMessage(seed),
        days: 1 + (seed % 600),
        onClick: () => {
          state.file = file;
          setLevel("view");
          render();
        },
      }),
    );
  }
}

// File view: GitHub blob — header with file name + line count, code below.
function renderBlob() {
  const address = sanitizeAddress({ ...state });
  const generated = generateFile(address);

  elements.blobHead.innerHTML = `
    <span class="blob-name">${ICONS.file}<strong>file-${state.file}.${EXTENSIONS[state.lang]}</strong></span>
    <span class="blob-meta">${generated.lines.length} lines · ${LANGUAGE_DEFS[state.lang].label} · seed ${generated.seed}</span>`;
  renderLinesInto(elements.fileCode, generated.lines);
}

function render() {
  renderBreadcrumb();
  renderActions();
  stateToUrl();

  const isView = state.level === "view";
  elements.grid.hidden = isView;
  elements.fileView.hidden = !isView;

  if (state.level === "repos") renderRepos();
  else if (state.level === "repo") renderFolders();
  else if (state.level === "folder") renderFiles();
  else renderBlob();
}

function bindEvents() {
  elements.lang.addEventListener("change", () => {
    state.lang = LANGUAGE_DEFS[elements.lang.value] ? elements.lang.value : "python";
    render();
  });

  window.addEventListener("popstate", () => {
    readUrl();
    elements.lang.value = state.lang;
    render();
  });
}

readUrl();
fillLanguageOptions();
bindEvents();
render();
