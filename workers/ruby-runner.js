// Module worker: runs a Ruby source string via ruby.wasm (CRuby compiled to
// WebAssembly/WASI). The runtime is loaded lazily on the first message and then
// cached for the life of the worker. Pinned to a verified version (like the
// Pyodide worker, this relaxes the project's otherwise offline/zero-dep stance).
//
// This is a module worker (see getRubyWorker in runner.js) because ruby.wasm's
// browser build is distributed as an ES module. The heavy wasm binary is fetched
// inside initRuby on first run, not at worker creation, so it downloads once.

// DefaultRubyVM lives in the package's browser ESM build, which imports
// @bjorn3/browser_wasi_shim as a bare specifier the browser can't resolve on its
// own — esm.sh rewrites that dependency to a fetchable URL, so we load the glue
// from there. The wasm binary itself is a plain file, served from jsdelivr.
import { DefaultRubyVM } from "https://esm.sh/@ruby/wasm-wasi@2.9.3-2.9.4/dist/esm/browser.js";

const RUBY_WASM_URL = "https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@2.9.3-2.9.4/dist/ruby+stdlib.wasm";

let vmReady = null; // Promise<RubyVM>, created once.

function initRuby() {
  if (!vmReady) {
    vmReady = (async () => {
      const response = await fetch(RUBY_WASM_URL);
      const module = await WebAssembly.compileStreaming(response);
      const { vm } = await DefaultRubyVM(module);
      // StringIO backs the stdout/stderr capture below; require it once.
      vm.eval(`require "stringio"`);
      return vm;
    })();
  }
  return vmReady;
}

self.onmessage = async (event) => {
  const { source } = event.data || {};

  let vm;
  try {
    vm = await initRuby();
  } catch (e) {
    self.postMessage({ ok: false, stdout: "", stderr: `Could not load Ruby runtime: ${e.message}` });
    return;
  }

  let ok = true;
  let stderr = "";

  try {
    // Redirect Ruby's stdout/stderr to in-memory buffers (fresh per run) so we can
    // read the output back, rather than plumbing through WASI's console bindings.
    // Kernel#puts/print/p all write to $stdout, so reassigning it captures them.
    // Kept inside the try so a failure here surfaces as stderr rather than an
    // unhandled rejection (which would not reach the parent and would time out).
    vm.eval(`$stdout = StringIO.new; $stderr = StringIO.new`);
    vm.eval(source);
  } catch (e) {
    ok = false;
    // The thrown error carries the Ruby exception (overwhelmingly a SyntaxError
    // or NameError for generated files — that is the output worth showing).
    stderr = e.message || String(e);
  }

  let stdout = "";
  try {
    stdout = vm.eval(`$stdout.string`).toString();
    const warnings = vm.eval(`$stderr.string`).toString();
    if (warnings) stderr = stderr ? `${warnings}\n${stderr}` : warnings;
  } catch {
    // Buffers unreadable after a hard failure — keep whatever stderr we have.
  }

  self.postMessage({ ok, stdout, stderr });
};
