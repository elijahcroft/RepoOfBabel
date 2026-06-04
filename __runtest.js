import { runCode, needsRuntimeLoad } from "./runner.js";

const out = document.getElementById("out");
const log = (line) => { out.textContent += "\n" + line; };

async function main() {
  out.textContent = "RESULTS:";

  // 1. JS known-good (proves Worker spawn + console capture + return path).
  const a = await runCode("javascript", "console.log(2 + 2)");
  log(`JS good      -> ok=${a.ok} stdout=${JSON.stringify(a.stdout)} stderr=${JSON.stringify(a.stderr)}`);

  // 2. JS syntax error (the common generated-file case).
  const b = await runCode("javascript", "if (data ! 42) {}");
  log(`JS synerr    -> ok=${b.ok} stderr=${JSON.stringify(b.stderr.slice(0, 60))}`);

  // 3. JS infinite loop (proves terminate-on-timeout, no tab freeze).
  const c = await runCode("javascript", "while (true) {}");
  log(`JS loop      -> ok=${c.ok} timedOut=${c.timedOut} ms=${c.durationMs}`);

  // 4. Unknown language fallback.
  const d = await runCode("ruby", "puts 1");
  log(`ruby fallbck -> ok=${d.ok} stderr=${JSON.stringify(d.stderr)}`);

  // 5. Python known-good (proves Pyodide lazy-load + stdout capture).
  log(`py needsLoad -> ${needsRuntimeLoad("python")}`);
  const e = await runCode("python", "print(2 + 2)");
  log(`PY good      -> ok=${e.ok} stdout=${JSON.stringify(e.stdout)} stderr=${JSON.stringify(e.stderr.slice(0,80))} ms=${e.durationMs}`);

  // 6. Python error / traceback (the common generated-file case).
  const f = await runCode("python", "return 5");
  log(`PY synerr    -> ok=${f.ok} stderr=${JSON.stringify(f.stderr.slice(-80))}`);

  document.title = "DONE";
  log("\n== DONE ==");
}

main().catch((err) => { document.title = "THREW"; log("THREW: " + err.message); });
