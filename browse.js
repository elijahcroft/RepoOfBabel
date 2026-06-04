import {
  LANGUAGE_DEFS,
  BOUNDS,
  generateFile,
  sanitizeAddress,
  renderLinesInto,
  linesToSource,
  buildCoordinate,
} from "./generator.js";
import { runCode, needsRuntimeLoad } from "./runner.js";

// Browse mimics GitHub. You start at the repo layer (an "explore" grid of
// repositories) and descend: repo → folder → file, each step styled like the
// matching GitHub surface (repo cards, file-listing table, blob view).
const LEVELS = ["repos", "repo", "folder", "view"];
const REPOS_PER_PAGE = 12;

const OWNER = "babel";
const EXTENSIONS = { python: "py", javascript: "js" };
const LANG_COLORS = { python: "#3572A5", javascript: "#f1e05a" };

const ADJECTIVES = [
  "async", "atomic", "binary", "cached", "canonical", "compiled", "concurrent", "deterministic",
  "dynamic", "eager", "eventual", "faulty", "fibonacci", "frozen", "generic", "headless",
  "idempotent", "immutable", "incremental", "indexed", "inline", "lazy", "legacy", "linked",
  "local", "memoized", "monadic", "null", "optimistic", "parallel", "recursive", "reentrant",
  "sandboxed", "semantic", "serverless", "shadow", "static", "tailcall", "typed", "virtual",
];
const NOUNS = [
  "adapter", "allocator", "ast", "bytecode", "cache", "callback", "closure", "compiler",
  "coroutine", "daemon", "diff", "fiber", "fixture", "formatter", "heap", "iterator",
  "kernel", "lambda", "linter", "lockfile", "module", "mutex", "parser", "pointer",
  "polyfill", "promise", "queue", "reducer", "registry", "router", "runtime", "sandbox",
  "schema", "semaphore", "snapshot", "socket", "stack", "thunk", "transpiler", "worker",
];
const REPO_NAMES = [
  "hello-world-again",
  "left-pad-lab",
  "off-by-one",
  "null-pointer-party",
  "callback-hellscape",
  "works-on-my-machine",
  "todo-or-not-todo",
  "merge-conflict-museum",
  "big-o-no",
  "git-blame-simulator",
  "semicolon-rescue",
  "tabs-vs-spaces",
  "ship-it-anyway",
  "localhost-forever",
  "production-ish",
  "cache-me-outside",
  "race-condition-ranch",
  "undefined-behavior",
  "stack-overflower",
  "dependency-jenga",
  "copy-paste-cathedral",
  "printf-prophecy",
  "unit-test-pending",
  "dark-mode-toggle",
  "scope-trim-refactor",
  "compile-and-pray",
  "npm-install-again",
  "one-more-migration",
  "regex-regrets",
  "final-final-v2",
  "feature-creep-control",
  "staging-survivor",
  "syntax-error-social",
  "hotfix-holiday",
  "readme-driven",
  "zero-day-todo",
  "golden-master",
  "flaky-test-farm",
  "api-shaped-hole",
  "monorepo-mirage",
];
const DESCRIPTIONS = [
  "Deterministic source generated from its coordinate.",
  "Every line discovered, never written.",
  "A repository that has always existed.",
  "Generated on read — identical every time.",
  "One of infinitely many possible repos.",
  "Source conjured from a single seed.",
  "Contains exactly one more TODO than expected.",
  "Works on this machine, and statistically several others.",
  "Now with fewer off-by-one regrets.",
  "A small monument to comments that aged poorly.",
  "Where temporary fixes become platform features.",
  "Carefully optimized until the profiler got suspicious.",
  "Mostly harmless, except during deploy windows.",
  "Includes a README that believes in you.",
  "Built from pure functions and questionable naming.",
  "No dependencies were harmed, only upgraded.",
  "A cache invalidation strategy with confidence issues.",
  "The tests pass when observed from the right angle.",
  "Committed before the meeting, debugged after.",
  "A tiny service with a large opinions folder.",
  "Feature complete, modulo reality.",
  "The happy path has excellent documentation.",
];
const BRANCH_NAMES = [
  "wip/one-line-fix",
  "feature/rubber-stamp",
  "feature/auth-flow",
  "fix/cache-key",
  "chore/update-deps",
  "refactor/parser",
  "release/v1.4",
  "hotfix/login-timeout",
  "feature/search",
  "fix/mobile-nav",
  "docs/api-notes",
  "test/coverage",
  "feature/dark-mode",
  "bugfix/session-ttl",
  "perf/render-cache",
  "ci/deploy-preview",
  "feature/user-settings",
  "fix/null-state",
  "chore/cleanup",
  "refactor/routes",
  "release/v2.0",
  "hotfix/payment-retry",
  "feature/importer",
  "fix/sort-order",
  "docs/readme",
  "test/e2e-flow",
  "feature/bulk-edit",
  "perf/query-plan",
  "ci/lint-rules",
  "chore/schema-sync",
  "refactor/state-store",
  "bugfix/edge-case",
  "feature/export-csv",
  "fix/off-by-one",
  "feature/hello-world",
  "refactor/no-more-globals",
  "chore/delete-todos",
  "spike/async-await",
  "fix/works-on-ci",
  "feature/print-debug",
  "cleanup/naming-things",
  "hotfix/prod-is-fine",
  "experiment/big-oops",
  "test/flaky-retry",
  "release/final-final",
  "fix/semicolon",
  "feature/ctrl-z",
  "chore/lockfile-again",
  "refactor/callbacks",
  "fix/null-pointer",
  "wip/ship-it",
  "docs/known-unknowns",
  "feature/cache-bust",
  "fix/timezone",
  "test/mock-the-world",
  "perf/memoize-all",
  "ci/green-ish",
  "chore/rename-again",
  "feature/localhost",
  "fix/prod-only",
  "refactor/tiny-cleanup",
  "release/vNext",
  "experiment/no-types",
  "fix/blame-proof",
  "docs/read-before-deploy",
];
const COMMIT_MESSAGES = [
  "update generated source",
  "refactor module",
  "tidy imports",
  "initial commit",
  "fix edge case",
  "add notes",
  "rework internals",
  "tweak constants",
  "make it work on my machine",
  "remove suspicious console log",
  "fix the fix from yesterday",
  "rename things until they make sense",
  "teach cache to forget",
  "handle the impossible state",
  "avoid off by one existential crisis",
  "convert TODO into maybe later",
  "make tests less dramatic",
  "appease the linter",
  "revert accidental cleverness",
  "document undocumented behavior",
  "add missing semicolon spiritually",
  "stop swallowing errors politely",
  "memoize the expensive shrug",
  "make null less surprising",
  "delete dead code with ceremony",
  "unflake the flaky path",
  "retry only when reality blinks",
  "fix typo in important typo",
  "make parser slightly less haunted",
  "move constants closer to truth",
  "split function before it splits us",
  "replace magic number with named magic",
  "keep backward compatibility alive",
  "make deploy button less judgmental",
  "remove temporary temporary fix",
  "update snapshot after negotiation",
  "teach router new trick",
  "make dark mode darker",
  "avoid race with future self",
  "reduce refactor scope",
  "ship smaller blast radius",
  "handle timezone weirdness",
  "turn panic into warning",
  "make happy path happier",
  "guard against empty everything",
  "normalize weird inputs",
  "prefer boring correctness",
  "make ci believe again",
  "patch the patch notes",
  "upgrade dependency, lower expectations",
  "make naming marginally better",
  "remove code that removed joy",
  "add fixture from parallel universe",
  "teach retry about patience",
  "squash entropy",
  "fix production shaped bug",
  "make loading less eternal",
  "simplify the simple part",
  "leave breadcrumb for future debugging",
  "avoid infinite nope",
  "make generated files look intentional",
];
const FOLDER_NAMES = [
  "src-of-truth",
  "callback-canyon",
  "cache-attic",
  "merge-conflicts",
  "null-island",
  "todo-vault",
  "feature-flags",
  "legacy-wing",
  "hotfix-desk",
  "dependency-corner",
  "test-lab",
  "debug-console",
  "runtime-shed",
  "schema-garden",
  "migration-queue",
  "lint-bunker",
  "snapshot-shelf",
  "parser-room",
  "api-drawer",
  "build-cache",
  "async-zone",
  "prod-mirror",
  "staging-area",
  "local-only",
  "types-closet",
  "fixture-stack",
  "release-notes",
  "dead-code",
  "perf-cave",
  "regex-corner",
  "router-table",
  "unit-tests",
];
const FILE_BASENAMES = [
  "hello_world",
  "off_by_one",
  "null_pointer",
  "works_on_my_machine",
  "final_final_v2",
  "cache_invalidator",
  "todo_factory",
  "merge_conflict",
  "big_o_no",
  "git_blame",
  "semicolon_saver",
  "dark_mode_toggle",
  "dependency_jenga",
  "printf_oracle",
  "snapshot_approved",
  "flaky_test",
  "race_condition",
  "callback_hell",
  "regex_regret",
  "feature_creep",
  "deploy_button",
  "legacy_adapter",
  "linter_whisperer",
  "timezone_trap",
  "magic_number",
  "happy_path",
  "edge_case",
  "mock_everything",
  "promise_keeper",
  "stack_trace",
  "readme_first",
  "ship_it",
];

const ICONS = {
  repo: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>',
  folder: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#54aeff" d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>',
  file: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#6e7781" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>',
  star: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>',
  branch: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path></svg>',
  tag: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"></path></svg>',
};

const elements = {
  lang: document.querySelector("#lang-input"),
  breadcrumb: document.querySelector("#breadcrumb"),
  actions: document.querySelector("#context-actions"),
  grid: document.querySelector("#browse-grid"),
  fileView: document.querySelector("#file-view"),
  blobHead: document.querySelector("#blob-head"),
  fileCode: document.querySelector("#file-code"),
  runBtn: document.querySelector("#run-btn"),
  runStatus: document.querySelector("#run-status"),
  terminal: document.querySelector("#terminal"),
  terminalWrap: document.querySelector("#terminal-wrap"),
  splitView: document.querySelector("#split-view"),
};

// Source of the file currently shown in the blob view; set by renderBlob and
// consumed by the Run handler.
let currentSource = "";

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
  const directName = REPO_NAMES[Math.floor(rng() * REPO_NAMES.length)];
  const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)];
  const name = rng() < 0.42 ? directName : `${adj}-${noun}`;
  const description = DESCRIPTIONS[Math.floor(rng() * DESCRIPTIONS.length)];
  const stars = Math.floor(rng() * 9000);
  const updatedDays = 1 + Math.floor(rng() * 900);
  return { name, description, stars, updatedDays };
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

function coordinateSeed(...parts) {
  return parts.reduce((seed, part) => {
    const value = Number(part) || 0;
    const mixed = value + 0x9e3779b9 + (seed << 6) + (seed >>> 2);
    return Math.imul(seed ^ mixed, 0x85ebca6b) >>> 0;
  }, 0x811c9dc5);
}

function pickFrom(list, seed, salt = 0) {
  return list[coordinateSeed(seed, salt) % list.length];
}

function branchLabel(branch, repo = state.repo) {
  const seed = coordinateSeed(repo, branch);
  const name = branch === 1 ? "main" : branch === 2 ? "dev" : pickFrom(BRANCH_NAMES, seed, 1);
  return `${name} · #${branch}`;
}

function folderLabel(folder, address = state) {
  const seed = coordinateSeed(address.repo, address.branch, folder);
  const base = pickFrom(FOLDER_NAMES, seed, 1);
  const useSuffix = (seed % 10) >= 4;
  const name = useSuffix ? `${base}-${pickFrom(NOUNS, seed, 2)}` : base;
  return `${name} · #${folder}`;
}

function fileLabel(file, lang, address = state) {
  const langSeed = lang === "javascript" ? 2 : 1;
  const seed = coordinateSeed(address.repo, address.branch, address.folder, file, langSeed);
  const base = pickFrom(FILE_BASENAMES, seed, 1);
  const useSuffix = (seed % 10) >= 4;
  const name = useSuffix ? `${base}_${pickFrom(NOUNS, seed, 2)}` : base;
  return `${name}.${EXTENSIONS[lang]} · #${file}`;
}

function commitMessage(seed) {
  return COMMIT_MESSAGES[seed % COMMIT_MESSAGES.length];
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

  const repoIndex = document.createElement("span");
  repoIndex.className = "ghcrumb-index";
  repoIndex.textContent = `#${state.repo}`;
  elements.breadcrumb.append(repoIndex);

  if (depth >= 2) {
    elements.breadcrumb.append(makeSep());
    elements.breadcrumb.append(
      crumbButton(folderLabel(state.folder), () => {
        setLevel("folder");
        render();
      }, state.level === "folder"),
    );
  }

  if (state.level === "view") {
    elements.breadcrumb.append(makeSep());
    elements.breadcrumb.append(crumbButton(fileLabel(state.file, state.lang), null, true));
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
  const toolbar = document.createElement("div");
  toolbar.className = "gh-repo-toolbar";

  const wrap = document.createElement("div");
  wrap.className = "gh-branch-wrap";

  const branchButton = document.createElement("button");
  branchButton.type = "button";
  branchButton.className = "gh-branch";
  branchButton.setAttribute("aria-haspopup", "listbox");
  branchButton.setAttribute("aria-expanded", "false");
  branchButton.setAttribute("aria-label", `Select branch, current ${branchLabel(state.branch, state.repo)}`);

  const branchRow = document.createElement("span");
  branchRow.className = "gh-branch-row";

  const branchIcon = document.createElement("span");
  branchIcon.className = "gh-branch-icon";
  branchIcon.innerHTML = ICONS.branch;

  const branchName = document.createElement("span");
  branchName.className = "gh-branch-name";
  branchName.textContent = branchLabel(state.branch, state.repo);

  const chevron = document.createElement("span");
  chevron.className = "gh-branch-chevron";
  chevron.setAttribute("aria-hidden", "true");

  const menu = document.createElement("div");
  menu.className = "gh-branch-menu";
  menu.hidden = true;
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Branches");

  const closeMenu = () => {
    menu.hidden = true;
    branchButton.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    menu.hidden = false;
    branchButton.setAttribute("aria-expanded", "true");
    menu.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  };

  const focusMenuOption = (option) => {
    option?.focus();
  };

  const menuOptions = [];
  for (let b = BOUNDS.branch.min; b <= BOUNDS.branch.max; b += 1) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "gh-branch-option";
    const label = branchLabel(b, state.repo);
    option.textContent = label;
    option.title = label;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(b === state.branch));
    option.addEventListener("click", () => {
      state.branch = b;
      render();
    });
    option.addEventListener("keydown", (event) => {
      const currentIndex = menuOptions.indexOf(option);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusMenuOption(menuOptions[Math.min(menuOptions.length - 1, currentIndex + 1)]);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusMenuOption(menuOptions[Math.max(0, currentIndex - 1)]);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusMenuOption(menuOptions[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        focusMenuOption(menuOptions[menuOptions.length - 1]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        branchButton.focus();
      }
    });
    menuOptions.push(option);
    menu.append(option);
  }

  branchButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) {
      openMenu();
      document.addEventListener("click", closeMenu, { once: true });
    } else {
      closeMenu();
    }
  });

  branchButton.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
      focusMenuOption(menu.querySelector('[aria-selected="true"]') ?? menuOptions[0]);
    }
  });

  menu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  branchRow.append(branchIcon, branchName, chevron);
  branchButton.append(branchRow);
  wrap.append(branchButton, menu);
  toolbar.append(wrap);

  // Lightweight inline branch / tag counts, like GitHub's repo header stats.
  const branchCount = BOUNDS.branch.max;
  const tagCount = 3 + Math.floor(seeded(state.repo * 31 + 7)() * 18);
  toolbar.append(
    statItem(ICONS.branch, branchCount, branchCount === 1 ? "Branch" : "Branches"),
    statItem(ICONS.tag, tagCount, tagCount === 1 ? "Tag" : "Tags"),
  );

  elements.actions.append(toolbar);

  const coord = document.createElement("span");
  coord.className = "gh-coord";
  coord.textContent = buildCoordinate(state);
  elements.actions.append(coord);
}

function statItem(icon, count, label) {
  const stat = document.createElement("span");
  stat.className = "gh-stat";
  stat.innerHTML = `${icon}<strong>${count}</strong> ${label}`;
  return stat;
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
      <div class="gh-repo-title">${ICONS.repo}<span class="gh-repo-name">${OWNER} / ${meta.name}</span><span class="gh-repo-index">repo #${repo}</span></div>
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
        name: folderLabel(folder, { ...state, folder }),
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
        name: fileLabel(file, state.lang, { ...state, file }),
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

  const nameEl = elements.blobHead.querySelector(".blob-name") ?? (() => {
    const el = document.createElement("span");
    el.className = "blob-name";
    elements.blobHead.prepend(el);
    return el;
  })();
  const metaEl = elements.blobHead.querySelector(".blob-meta") ?? (() => {
    const el = document.createElement("span");
    el.className = "blob-meta";
    elements.blobHead.querySelector(".blob-run").before(el);
    return el;
  })();
  nameEl.innerHTML = `${ICONS.file}<strong>${fileLabel(state.file, state.lang)}</strong>`;
  metaEl.textContent = `${generated.lines.length} lines · ${LANGUAGE_DEFS[state.lang].label} · seed ${generated.seed}`;
  renderLinesInto(elements.fileCode, generated.lines);

  // Reset the terminal for the new file and arm the Run button.
  currentSource = linesToSource(generated.lines);
  resetTerminal();
}

function resetTerminal() {
  elements.terminalWrap.hidden = true;
  elements.terminal.innerHTML = "";
  elements.runStatus.textContent = "";
  elements.runBtn.disabled = false;
  elements.splitView.classList.remove("has-output");
}

async function runCurrentFile() {
  elements.runBtn.disabled = true;
  elements.runStatus.textContent = needsRuntimeLoad(state.lang) ? "Loading runtime…" : "Running…";

  const result = await runCode(state.lang, currentSource);

  elements.terminal.innerHTML = "";
  if (result.stdout) {
    const stdout = document.createElement("span");
    stdout.className = "stdout";
    stdout.textContent = result.stdout;
    elements.terminal.append(stdout);
  }
  if (result.stderr) {
    const stderr = document.createElement("span");
    stderr.className = "stderr";
    stderr.textContent = (result.stdout ? "\n" : "") + result.stderr;
    elements.terminal.append(stderr);
  }
  if (!result.stdout && !result.stderr) {
    const empty = document.createElement("span");
    empty.className = "term-empty";
    empty.textContent = "(no output)";
    elements.terminal.append(empty);
  }
  elements.terminalWrap.hidden = false;
  elements.splitView.classList.add("has-output");

  elements.runStatus.textContent = result.timedOut
    ? "timed out"
    : result.ok
      ? `exit ok · ${result.durationMs}ms`
      : `error · ${result.durationMs}ms`;
  elements.runBtn.disabled = false;
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

  elements.runBtn.addEventListener("click", runCurrentFile);

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
