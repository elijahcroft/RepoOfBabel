"use strict";

// Strips basic TypeScript type annotations so the generated token-soup can run
// as plain JS. Handles: type annotations (: Type), type assertions (<Type> and
// as Type), interface/type declarations, and readonly/optional modifiers.
function stripTypes(source) {
  return source
    .replace(/\binterface\s+\w+\s*\{[^}]*\}/g, "")
    .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, "")
    .replace(/\s+as\s+\w+/g, "")
    .replace(/:\s*\w+(\[\])?(?=[,)\s;={])/g, "")
    .replace(/\breadonly\s+/g, "");
}

self.onmessage = (event) => {
  const { source } = event.data || {};
  const out = [];
  const err = [];

  const format = (args) =>
    args
      .map((value) => {
        if (typeof value === "string") return value;
        try { return JSON.stringify(value); } catch { return String(value); }
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
    const run = new Function("console", stripTypes(source));
    run(console);
  } catch (e) {
    ok = false;
    err.push(e && e.stack ? `${e.name}: ${e.message}` : String(e));
  }

  self.postMessage({ ok, stdout: out.join("\n"), stderr: err.join("\n") });
};
