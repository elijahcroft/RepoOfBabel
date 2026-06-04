// Classic Web Worker: runs a Python source string via Pyodide (WebAssembly).
// Pyodide is ~10MB and is loaded lazily on the first message, then cached for
// the life of the worker. Pinned to a verified version (see runner.js for why
// this relaxes the project's otherwise offline/zero-dep stance).
"use strict";

const PYODIDE_VERSION = "v0.29.4";
importScripts(`https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.js`);

let pyodideReady = null; // Promise<Pyodide>, created once.

// Output buffers for the current run; setStdout/setStderr (batched) append here.
let out = [];
let err = [];

// Pyodide runs user code inside its own eval_code_async machinery, so a raw
// traceback is topped with internal frames (File ".../_pyodide/_base.py", ...)
// that mean nothing to someone looking at the generated file. User code is the
// only thing compiled as "<exec>", so we keep just those frames (plus the
// Traceback header and final exception line) and drop the runtime's internals.
function cleanTraceback(message) {
  const lines = message.split("\n");
  const kept = [];
  let i = 0;
  while (i < lines.length) {
    const fileMatch = lines[i].match(/^\s*File "(.*?)", line/);
    if (fileMatch) {
      // Gather this frame: its File line plus the indented source/caret lines
      // that follow, up to the next frame or the unindented exception summary.
      const frame = [lines[i++]];
      while (i < lines.length && !/^\s*File "/.test(lines[i]) && /^\s/.test(lines[i])) {
        frame.push(lines[i++]);
      }
      if (fileMatch[1] === "<exec>") kept.push(...frame);
    } else {
      kept.push(lines[i++]); // header and exception line(s)
    }
  }
  return kept.join("\n");
}

function initPyodide() {
  if (!pyodideReady) {
    pyodideReady = loadPyodide().then((py) => {
      py.setStdout({ batched: (text) => out.push(text) });
      py.setStderr({ batched: (text) => err.push(text) });
      return py;
    });
  }
  return pyodideReady;
}

self.onmessage = async (event) => {
  const { source } = event.data || {};
  out = [];
  err = [];

  let py;
  try {
    py = await initPyodide();
  } catch (e) {
    self.postMessage({ ok: false, stdout: "", stderr: `Could not load Python runtime: ${e.message}` });
    return;
  }

  let ok = true;
  try {
    await py.runPythonAsync(source);
  } catch (e) {
    ok = false;
    // PythonError.message carries the full traceback (SyntaxError/IndentationError
    // is the overwhelmingly common case for generated files — that's the output).
    // Strip Pyodide's internal frames so only the generated file's error shows.
    err.push(cleanTraceback(e.message || String(e)));
  }

  self.postMessage({ ok, stdout: out.join(""), stderr: err.join("") });
};
