"use strict";

// fengari-web has a DOM-integration branch (auto-running <script type="application/lua">
// tags) gated on `document instanceof HTMLDocument`. A worker has no HTMLDocument, so we
// leave `document` undefined to short-circuit that guard rather than crash inside it.
self.window = self;

importScripts("./fengari-web.js");

self.onmessage = (event) => {
  const { source } = event.data || {};
  const out = [];
  const err = [];

  try {
    const L = fengari.lauxlib.luaL_newstate();
    fengari.lualib.luaL_openlibs(L);

    // Override print to capture output
    const printFn = (luaState) => {
      const n = fengari.lua.lua_gettop(luaState);
      const parts = [];
      for (let i = 1; i <= n; i++) {
        parts.push(fengari.lua.lua_tojsstring(luaState, i) ?? String(fengari.lua.lua_tonumber(luaState, i)));
      }
      out.push(parts.join("\t"));
      return 0;
    };

    fengari.lua.lua_pushcfunction(L, printFn);
    fengari.lua.lua_setglobal(L, fengari.to_luastring("print"));

    const status = fengari.lauxlib.luaL_dostring(L, fengari.to_luastring(source));
    if (status !== fengari.lua.LUA_OK) {
      const msg = fengari.lua.lua_tojsstring(L, -1);
      err.push(msg ?? "Lua error");
    }

    self.postMessage({ ok: status === fengari.lua.LUA_OK, stdout: out.join("\n"), stderr: err.join("\n") });
  } catch (e) {
    self.postMessage({ ok: false, stdout: "", stderr: e.message || String(e) });
  }
};
