// Classic Web Worker: executes a JS source string and reports captured output.
// Lives in a worker so the main thread can terminate it if the (occasionally
// real) generated code spins forever. No DOM here — worker global scope only.
"use strict";

self.onmessage = (event) => {
  const { source } = event.data || {};
  const out = [];
  const err = [];

  const format = (args) =>
    args
      .map((value) => {
        if (typeof value === "string") return value;
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      })
      .join(" ");

  const console = {
    log: (...args) => out.push(format(args)),
    info: (...args) => out.push(format(args)),
    debug: (...args) => out.push(format(args)),
    warn: (...args) => err.push(format(args)),
    error: (...args) => err.push(format(args)),
  };

  let ok = true;
  try {
    // `console` is passed in explicitly rather than relying on the worker global,
    // so all output is captured regardless of how the code references it.
    const run = new Function("console", source);
    run(console);
  } catch (e) {
    ok = false;
    err.push(e && e.stack ? `${e.name}: ${e.message}` : String(e));
  }

  self.postMessage({ ok, stdout: out.join("\n"), stderr: err.join("\n") });
};
