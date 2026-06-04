// Executes generated source in the browser and returns captured output.
//
// The seam for adding languages: register a runner in RUNNERS keyed by the
// generator's `lang`. Each runner resolves a result object:
//   { ok, stdout, stderr, durationMs, timedOut }
// Languages with no runner fall through to a friendly "not supported yet".
//
// JavaScript runs in a throwaway Worker (terminable on timeout — the generated
// token-soup occasionally parses into a real loop that would otherwise freeze
// the tab). Python runs in a single cached Pyodide Worker, lazy-loaded on first
// use (~10MB from the CDN); it is reused across runs so the download happens once.

const JS_TIMEOUT_MS = 3000;
const PY_RUN_TIMEOUT_MS = 15000; // generous: first run also pays Pyodide load time

function emptyResult() {
  return { ok: false, stdout: "", stderr: "", durationMs: 0, timedOut: false };
}

// Runs `source` in a fresh worker, enforcing `timeoutMs`. The worker is expected
// to postMessage `{ ok, stdout, stderr }`. On timeout we terminate it (the only
// reliable way to kill a runaway loop) and call onTimeout() so callers can drop
// any cached reference to the now-dead worker.
function runInWorker(makeWorker, source, timeoutMs, onTimeout) {
  return new Promise((resolve) => {
    const started = performance.now();
    let settled = false;
    let worker;

    try {
      worker = makeWorker();
    } catch (err) {
      resolve({ ...emptyResult(), stderr: `Could not start runtime: ${err.message}` });
      return;
    }

    const finish = (partial) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...emptyResult(), durationMs: Math.round(performance.now() - started), ...partial });
    };

    const timer = setTimeout(() => {
      worker.terminate();
      onTimeout?.();
      finish({ ok: false, timedOut: true, stderr: "Execution timed out (possible infinite loop)." });
    }, timeoutMs);

    worker.onmessage = (event) => {
      const { ok, stdout = "", stderr = "" } = event.data || {};
      finish({ ok: Boolean(ok), stdout, stderr });
    };
    worker.onerror = (event) => {
      finish({ ok: false, stderr: event.message || "Worker error." });
    };

    worker.postMessage({ source });
  });
}

function runJs(source) {
  // Fresh worker per run: cheap, and guarantees a clean global scope each time.
  return runInWorker(() => new Worker("./workers/js-runner.js"), source, JS_TIMEOUT_MS);
}

// The Pyodide worker is expensive to create (downloads + initializes the runtime),
// so it is created once and reused. If a run times out we terminate and clear the
// cache, forcing a fresh load on the next attempt.
let pyWorker = null;

function getPyWorker() {
  if (!pyWorker) {
    pyWorker = new Worker("./workers/py-runner.js");
  }
  return pyWorker;
}

function runPython(source) {
  return runInWorker(getPyWorker, source, PY_RUN_TIMEOUT_MS, () => {
    pyWorker = null;
  });
}

const RUNNERS = {
  javascript: runJs,
  python: runPython,
};

// True when running `lang` will load a heavy runtime that isn't ready yet — lets
// the UI show "Loading runtime…" on the first Python run.
export function needsRuntimeLoad(lang) {
  return lang === "python" && pyWorker === null;
}

export async function runCode(lang, source) {
  const runner = RUNNERS[lang];
  if (!runner) {
    return { ...emptyResult(), stderr: `Execution not supported for ${lang} yet.` };
  }
  return runner(source);
}
