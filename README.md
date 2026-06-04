# Repo of Babel

A client-only static web app that deterministically generates fake source code from an address. No API calls, no AI, no dependencies, no build step. The same address always produces the same output, forever.

## Concept

This is a software-engineering riff on Jorge Luis Borges' *Library of Babel* — a fictional library containing every possible book, where each book exists at a fixed address (room, shelf, book, page). Here, the "library" is an infinite namespace of fake repositories, and every address resolves to a unique, stable page of generated code.

The Borges original uses: `room → shelf → book → page`  
This app uses: `repo → branch → folder → file`

The hierarchy rolls over just like the original — navigating past the last file in a folder increments the folder, and so on up the chain.

## Address Scheme

The canonical URL shape is:

```
?repo=4&branch=12&folder=7&file=3&lang=python
```

Address bounds:

| Level  | Min | Max              |
|--------|-----|------------------|
| repo   | 1   | ∞                |
| branch | 1   | 32               |
| folder | 1   | 128              |
| file   | 1   | 64               |

**Legacy params** (`room`, `shelf`, `book`, `page`) are still accepted on read and silently rewritten to the current scheme. Do not remove this backward-compat layer.

## Determinism Rules

**Do not break these without explicit intent — changing them alters the entire generated corpus.**

1. Build the seed string as `repo-branch-folder-file-lang` via `buildAddressString()`.
2. Hash that string with `fnv1a` (32-bit FNV-1a).
3. Seed `mulberry32` with the result.
4. Use that PRNG sequence to choose templates, indentation changes, and token selections.
5. Every file generates exactly **64 lines**.

Same address → same seed → same PRNG sequence → same generated file.

## File Structure

```
index.html   static shell and form controls
styles.css   visual design and syntax-token colors
app.js       all logic: state, URL sync, seeded generation, rendering, navigation
```

No framework, bundler, or install step. Open `index.html` in a browser or serve the folder with any static server.

## Core Functions in app.js

| Function | Role |
|---|---|
| `buildAddressString(address)` | Builds the seed input string — **corpus-sensitive** |
| `fnv1a(input)` | Hashes the seed string to a 32-bit integer — **corpus-sensitive** |
| `mulberry32(seed)` | Seeded PRNG — **corpus-sensitive** |
| `generateFile(address)` | Drives line generation for one address |
| `renderTemplate(template, def, random)` | Dispatches to language-specific line builder |
| `pythonLine` / `javascriptLine` | Language-specific token assembly — **corpus-sensitive** |
| `sanitizeAddress(raw)` | Clamps and validates raw input to legal bounds |
| `addressFromUrl()` | Reads URL params (including legacy aliases) into an address object |
| `writeAddressToUrl(address)` | Syncs current address to the URL query string |
| `stepAddress(address, direction)` | Implements hierarchical navigation with rollover |
| `setFormValues(address)` | Writes address to form inputs, skipping the focused field to avoid fighting the user mid-edit |

## Language Definition Contract

Languages live in `LANGUAGE_DEFS` at the top of `app.js`. Each entry has:

- `label` — display name
- `commentPrefix` — e.g. `"# "` or `"// "`
- `blockOpeners` — tokens that trigger an indent increase when they appear at line start followed by `:` or `{`
- `tokens` — `{ keywords, builtins, operators, identifiers, literals, punctuation }`
- `templates` — list of template names the generator can pick from: `assignment`, `func_def`, `if_stmt`, `loop_stmt`, `return_stmt`, `expr_stmt`, `comment`

Adding a language means adding an entry to `LANGUAGE_DEFS` and a `<langName>Line()` function. Wire it into `renderTemplate()`. Template names are shared across languages — if a new language needs a unique construct, add a new template name and handle it in the fallthrough `default` case of other languages.

## Change Sensitivity

These areas change the generated corpus — treat them as content-model changes, not refactors:

- `buildAddressString()` — changes seed inputs
- `fnv1a()` — changes the hash
- `mulberry32()` — changes PRNG output
- Template selection order within `def.templates`
- Token lists (order matters — the PRNG picks by index)
- Indentation logic (the `0.18` probability, `shouldIncreaseIndent`)
- Line count (currently hardcoded `64`)

Anything else (UI, CSS, navigation logic, URL param names, display labels) is safe to change freely.

## Navigation Semantics

Address components roll over hierarchically. When `file` exceeds its max, it wraps to `min` and `folder` increments. Same pattern up to `repo`. `stepAddress()` in `app.js` implements all cases.

The UI exposes per-level steppers (Repo / Branch / Folder / File), a Random Jump, and a Copy Link button.

## Running Locally

```bash
# Simplest — open directly:
open index.html

# Or serve with a static server (required for ES module imports in some browsers):
python3 -m http.server 8080

# Verify JS parses:
node --check app.js
```

## Constraints for Future Work

- Keep the app fully client-side. No network calls for generation.
- Preserve deterministic output for a given address unless a corpus break is explicitly approved.
- If you change anything in the corpus-sensitive list above, call it out clearly.
- Prefer adding languages/features in ways that don't change existing addresses' outputs.
- The `setFormValues` function intentionally skips the currently focused input — do not "fix" this, it prevents the form from fighting the user while typing.

## Good Next Steps

- More languages: `c`, `rust`, `go`
- Search nearby addresses for a token or regex
- Bookmarks persisted in localStorage
- Path-style address display: `repo/branch/folder/file.lang`
