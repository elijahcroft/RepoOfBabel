// Shared deterministic code generator for the Repo of Babel.
// An address (repo/branch/folder/file/lang) seeds an RNG that always
// produces the same "file", so any coordinate is permanently browsable.

export const LANGUAGE_DEFS = {
  python: {
    label: "Python",
    icon: `<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M8 0C5.24 0 5.5 1.24 5.5 1.24V2.5h2.56v.38H3.94S2 2.69 2 5.5s1.75 2.75 1.75 2.75H4.8V6.94s-.06-1.69 1.63-1.69H9.2s1.55.03 1.55-1.5V1.5S11.1 0 8 0zM6.5.88a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z" fill="#4B8BBE"/><path d="M8 16c2.76 0 2.5-1.24 2.5-1.24V13.5H7.94v-.38h4.12S14 13.31 14 10.5s-1.75-2.75-1.75-2.75H11.2V9.06s.06 1.69-1.63 1.69H6.8s-1.55-.03-1.55 1.5v2.25S4.9 16 8 16zm1.5-.88a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" fill="#FFD43B"/></svg>`,
    commentPrefix: "# ",
    blockOpeners: ["def", "if", "for", "while", "class", "try", "with"],
    tokens: {
      keywords: ["def", "if", "else", "for", "while", "return", "class", "import", "try", "with"],
      builtins: ["print", "len", "range", "list", "dict", "str", "int", "open", "zip", "map"],
      operators: ["=", "==", "!=", "+", "-", "*", "/", "%", "and", "or", "not", "in"],
      identifiers: ["x", "y", "n", "i", "j", "result", "data", "value", "items", "node", "key", "buf"],
      literals: ["0", "1", "True", "False", "None", "\"\"", "[]", "{}", "-1", "42"],
      punctuation: ["(", ")", ":", ",", "[", "]", "."],
    },
    templates: ["assignment", "func_def", "if_stmt", "loop_stmt", "return_stmt", "expr_stmt", "comment"],
  },
  javascript: {
    label: "JavaScript",
    icon: `<svg viewBox="0 0 32 32" width="14" height="14"><rect width="32" height="32" rx="4" fill="#F7DF1E"/><path d="M9.5 25.5l2.1-1.27c.4.72.77 1.33 1.65 1.33.84 0 1.37-.33 1.37-1.61V16h2.58v7.98c0 2.65-1.55 3.86-3.82 3.86-2.05 0-3.24-1.06-3.88-2.34zm9.03.26l2.1-1.22c.55.9 1.27 1.56 2.54 1.56 1.07 0 1.75-.53 1.75-1.27 0-.88-.7-1.19-1.88-1.7l-.65-.28c-1.86-.79-3.1-1.79-3.1-3.89 0-1.94 1.48-3.41 3.79-3.41 1.64 0 2.82.57 3.67 2.06l-2.01 1.29c-.44-.79-.92-1.1-1.66-1.1-.75 0-1.23.48-1.23 1.1 0 .77.48 1.08 1.59 1.56l.65.28c2.19.94 3.44 1.9 3.44 4.05 0 2.32-1.82 3.6-4.27 3.6-2.39 0-3.94-1.14-4.73-2.63z"/></svg>`,
    commentPrefix: "// ",
    blockOpeners: ["function", "if", "for", "while", "class", "try"],
    tokens: {
      keywords: ["function", "if", "else", "for", "while", "return", "class", "import", "try", "const"],
      builtins: ["console.log", "Array", "Object", "String", "Number", "Boolean", "Map", "Set", "parseInt", "JSON.stringify"],
      operators: ["=", "===", "!==", "+", "-", "*", "/", "%", "&&", "||", "!", "in"],
      identifiers: ["x", "y", "n", "i", "j", "result", "data", "value", "items", "node", "key", "buf"],
      literals: ["0", "1", "true", "false", "null", "\"\"", "[]", "{}", "-1", "42"],
      punctuation: ["(", ")", "{", "}", ":", ",", "[", "]", ".", ";"],
    },
    templates: ["assignment", "func_def", "if_stmt", "loop_stmt", "return_stmt", "expr_stmt", "comment"],
  },
  lua: {
    label: "Lua",
    icon: `<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" fill="#00007C"/><circle cx="8" cy="8" r="4.5" fill="white"/><circle cx="11" cy="5" r="2" fill="white"/></svg>`,
    commentPrefix: "-- ",
    blockOpeners: ["function", "if", "for", "while"],
    tokens: {
      keywords: ["local", "function", "if", "then", "else", "end", "for", "while", "do", "return", "and", "or", "not"],
      builtins: ["print", "tostring", "tonumber", "type", "pairs", "ipairs", "table.insert", "string.format", "math.floor", "io.write"],
      operators: ["=", "==", "~=", "+", "-", "*", "/", "%", "and", "or", "not", ".."],
      identifiers: ["x", "y", "n", "i", "j", "result", "data", "value", "items", "node", "key", "buf"],
      literals: ["0", "1", "true", "false", "nil", '""', "{}", "-1", "42", "math.pi"],
      punctuation: ["(", ")", ",", ".", "[", "]"],
    },
    templates: ["assignment", "func_def", "if_stmt", "loop_stmt", "return_stmt", "expr_stmt", "comment"],
  },
  typescript: {
    label: "TypeScript",
    icon: `<svg viewBox="0 0 32 32" width="14" height="14"><rect width="32" height="32" rx="4" fill="#3178C6"/><path d="M17.44 26v-2.19c.51.3 1.12.54 1.82.7.7.17 1.38.25 2.02.25.4 0 .77-.04 1.1-.11.33-.07.61-.18.84-.32.23-.14.41-.32.53-.53.13-.21.19-.46.19-.74 0-.36-.1-.67-.3-.94a3.1 3.1 0 0 0-.8-.74 8.5 8.5 0 0 0-1.17-.66 26 26 0 0 1-1.4-.75 6.6 6.6 0 0 1-1.09-.82 3.5 3.5 0 0 1-.73-1.04 3.3 3.3 0 0 1-.27-1.38c0-.6.13-1.12.39-1.56.26-.44.6-.8 1.04-1.09.43-.28.93-.49 1.49-.62.56-.14 1.14-.2 1.74-.2 1.23 0 2.16.1 2.78.3v2.1a5.3 5.3 0 0 0-2.91-.63c-.37 0-.71.04-1.02.11a2.5 2.5 0 0 0-.8.31c-.22.14-.4.31-.52.52a1.4 1.4 0 0 0-.19.73c0 .33.08.61.24.85.16.24.39.46.68.66.3.2.64.4 1.04.6.4.2.84.43 1.33.68.52.28.99.57 1.41.88.42.31.78.65 1.07 1.02.3.37.52.78.68 1.22.16.44.24.95.24 1.51 0 .64-.13 1.19-.39 1.63-.26.44-.61.8-1.05 1.07-.44.27-.94.47-1.5.59-.56.12-1.14.19-1.74.19-.24 0-.53-.02-.87-.05a9.3 9.3 0 0 1-1.02-.16 7.5 7.5 0 0 1-.96-.27 3.6 3.6 0 0 1-.74-.38zM9 16.09H5.5V14h9.5v2.09H11.5V26H9V16.09z" fill="#fff"/></svg>`,
    commentPrefix: "// ",
    blockOpeners: ["function", "if", "for", "while", "class", "try"],
    tokens: {
      keywords: ["function", "if", "else", "for", "while", "return", "class", "const", "type", "interface", "readonly"],
      builtins: ["console.log", "Array", "Object", "String", "Number", "Boolean", "Map", "Set", "parseInt", "JSON.stringify"],
      operators: ["=", "===", "!==", "+", "-", "*", "/", "%", "&&", "||", "!", "??"],
      identifiers: ["x", "y", "n", "i", "j", "result", "data", "value", "items", "node", "key", "buf"],
      literals: ["0", "1", "true", "false", "null", "\"\"", "[]", "{}", "-1", "42"],
      punctuation: ["(", ")", "{", "}", ":", ",", "[", "]", ".", ";"],
    },
    templates: ["assignment", "func_def", "if_stmt", "loop_stmt", "return_stmt", "expr_stmt", "comment"],
  },
};

export const DEFAULT_ADDRESS = {
  repo: 4,
  branch: 12,
  folder: 7,
  file: 3,
  lang: "python",
};

export const BOUNDS = {
  repo: { min: 1, max: Number.MAX_SAFE_INTEGER },
  branch: { min: 1, max: 32 },
  folder: { min: 1, max: 128 },
  file: { min: 1, max: 64 },
};

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fnv1a(input) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sample(list, random) {
  return list[Math.floor(random() * list.length)];
}

function buildToken(text, type = "plain") {
  return { text, type };
}

function pickIdentifier(def, random) {
  return buildToken(sample(def.tokens.identifiers, random), "identifier");
}

function pickBuiltin(def, random) {
  return buildToken(sample(def.tokens.builtins, random), "builtin");
}

function pickLiteral(def, random) {
  return buildToken(sample(def.tokens.literals, random), "literal");
}

function pickOperator(def, random) {
  return buildToken(sample(def.tokens.operators, random), "operator");
}

function keyword(text) {
  return buildToken(text, "keyword");
}

function plain(text) {
  return buildToken(text, "plain");
}

function punctuation(text) {
  return buildToken(text, "punctuation");
}

function joinSegments(parts) {
  return parts.flat();
}

function generateExpression(def, random) {
  const variant = Math.floor(random() * 4);

  if (variant === 0) {
    return [pickIdentifier(def, random), plain(" "), pickOperator(def, random), plain(" "), pickLiteral(def, random)];
  }

  if (variant === 1) {
    return [pickBuiltin(def, random), punctuation("("), pickIdentifier(def, random), punctuation(")")];
  }

  if (variant === 2) {
    return [pickLiteral(def, random)];
  }

  return [pickIdentifier(def, random), punctuation("."), pickIdentifier(def, random)];
}

function pythonLine(template, def, random) {
  switch (template) {
    case "assignment":
      return joinSegments([pickIdentifier(def, random), plain(" "), buildToken("=", "operator"), plain(" "), generateExpression(def, random)]);
    case "func_def":
      return joinSegments([
        keyword("def"),
        plain(" "),
        pickIdentifier(def, random),
        punctuation("("),
        pickIdentifier(def, random),
        punctuation(","),
        plain(" "),
        pickIdentifier(def, random),
        punctuation(")"),
        punctuation(":"),
      ]);
    case "if_stmt":
      return joinSegments([
        keyword("if"),
        plain(" "),
        pickIdentifier(def, random),
        plain(" "),
        pickOperator(def, random),
        plain(" "),
        pickLiteral(def, random),
        punctuation(":"),
      ]);
    case "loop_stmt":
      return joinSegments([
        keyword("for"),
        plain(" "),
        pickIdentifier(def, random),
        plain(" "),
        keyword("in"),
        plain(" "),
        pickBuiltin(def, random),
        punctuation("("),
        pickLiteral(def, random),
        punctuation(")"),
        punctuation(":"),
      ]);
    case "return_stmt":
      return joinSegments([keyword("return"), plain(" "), generateExpression(def, random)]);
    case "comment":
      return [buildToken(`${def.commentPrefix}${sample(def.tokens.identifiers, random)} ${sample(def.tokens.identifiers, random)} ${sample(def.tokens.literals, random)}`, "comment")];
    default:
      return generateExpression(def, random);
  }
}

function javascriptLine(template, def, random) {
  switch (template) {
    case "assignment":
      return joinSegments([
        keyword("const"),
        plain(" "),
        pickIdentifier(def, random),
        plain(" "),
        buildToken("=", "operator"),
        plain(" "),
        generateExpression(def, random),
        punctuation(";"),
      ]);
    case "func_def":
      return joinSegments([
        keyword("function"),
        plain(" "),
        pickIdentifier(def, random),
        punctuation("("),
        pickIdentifier(def, random),
        punctuation(","),
        plain(" "),
        pickIdentifier(def, random),
        punctuation(")"),
        plain(" "),
        punctuation("{"),
      ]);
    case "if_stmt":
      return joinSegments([
        keyword("if"),
        plain(" "),
        punctuation("("),
        pickIdentifier(def, random),
        plain(" "),
        pickOperator(def, random),
        plain(" "),
        pickLiteral(def, random),
        punctuation(")"),
        plain(" "),
        punctuation("{"),
      ]);
    case "loop_stmt":
      return joinSegments([
        keyword("for"),
        plain(" "),
        punctuation("("),
        keyword("const"),
        plain(" "),
        pickIdentifier(def, random),
        plain(" "),
        keyword("in"),
        plain(" "),
        pickIdentifier(def, random),
        punctuation(")"),
        plain(" "),
        punctuation("{"),
      ]);
    case "return_stmt":
      return joinSegments([keyword("return"), plain(" "), generateExpression(def, random), punctuation(";")]);
    case "comment":
      return [buildToken(`${def.commentPrefix}${sample(def.tokens.identifiers, random)} ${sample(def.tokens.identifiers, random)} ${sample(def.tokens.literals, random)}`, "comment")];
    default:
      return joinSegments([generateExpression(def, random), punctuation(";")]);
  }
}

function luaLine(template, def, random) {
  switch (template) {
    case "assignment":
      return joinSegments([keyword("local"), plain(" "), pickIdentifier(def, random), plain(" "), buildToken("=", "operator"), plain(" "), generateExpression(def, random)]);
    case "func_def":
      return joinSegments([
        keyword("local"), plain(" "), keyword("function"), plain(" "),
        pickIdentifier(def, random), punctuation("("),
        pickIdentifier(def, random), punctuation(","), plain(" "), pickIdentifier(def, random),
        punctuation(")"),
      ]);
    case "if_stmt":
      return joinSegments([
        keyword("if"), plain(" "),
        pickIdentifier(def, random), plain(" "), pickOperator(def, random), plain(" "), pickLiteral(def, random),
        plain(" "), keyword("then"),
      ]);
    case "loop_stmt":
      return joinSegments([
        keyword("for"), plain(" "),
        pickIdentifier(def, random), plain(" "), buildToken("=", "operator"), plain(" "),
        pickLiteral(def, random), punctuation(","), plain(" "), pickLiteral(def, random),
        plain(" "), keyword("do"),
      ]);
    case "return_stmt":
      return joinSegments([keyword("return"), plain(" "), generateExpression(def, random)]);
    case "comment":
      return [buildToken(`${def.commentPrefix}${sample(def.tokens.identifiers, random)} ${sample(def.tokens.identifiers, random)} ${sample(def.tokens.literals, random)}`, "comment")];
    default:
      return generateExpression(def, random);
  }
}

function renderTemplate(template, def, random) {
  if (def === LANGUAGE_DEFS.python) return pythonLine(template, def, random);
  if (def === LANGUAGE_DEFS.lua) return luaLine(template, def, random);
  return javascriptLine(template, def, random);
}


function shouldIncreaseIndent(segments, def) {
  const text = segments.map((segment) => segment.text).join("");
  if (def === LANGUAGE_DEFS.lua) {
    return def.blockOpeners.some((opener) => text.startsWith(opener)) && /(then|do)\s*$/.test(text);
  }
  return def.blockOpeners.some((opener) => text.startsWith(opener)) && /(:|\{)\s*$/.test(text);
}

function closingLine(def) {
  if (def === LANGUAGE_DEFS.javascript || def === LANGUAGE_DEFS.typescript) {
    return [punctuation("}")];
  }
  if (def === LANGUAGE_DEFS.lua) {
    return [keyword("end")];
  }
  return [buildToken(`${def.commentPrefix.trim()} end`, "comment")];
}

export function buildAddressString(address) {
  return `${address.repo}-${address.branch}-${address.folder}-${address.file}-${address.lang}`;
}

// A Dewey-style coordinate shown on browse/view pages, e.g. r4-b12-f7-v3.
export function buildCoordinate(address) {
  return `r${address.repo}-b${address.branch}-f${address.folder}-v${address.file}`;
}

export function generateFile(address) {
  const def = LANGUAGE_DEFS[address.lang];
  const seed = fnv1a(buildAddressString(address));
  const random = mulberry32(seed);
  const lineCount = 64;
  const lines = [];
  let indentLevel = 0;

  for (let index = 0; index < lineCount; index += 1) {
    if (indentLevel > 0 && random() < 0.18) {
      indentLevel -= 1;

      if (def === LANGUAGE_DEFS.javascript) {
        lines.push({ indentLevel, segments: closingLine(def) });
      }
    }

    const template = sample(def.templates, random);
    const segments = renderTemplate(template, def, random);
    lines.push({ indentLevel, segments });

    if (shouldIncreaseIndent(segments, def)) {
      indentLevel += 1;
    }
  }

  while (indentLevel > 0 && def === LANGUAGE_DEFS.javascript) {
    indentLevel -= 1;
    lines.push({ indentLevel, segments: closingLine(def) });
  }

  return { lines, seed };
}

export function sanitizeAddress(rawAddress) {
  const lang = LANGUAGE_DEFS[rawAddress.lang] ? rawAddress.lang : DEFAULT_ADDRESS.lang;

  return {
    repo: clamp(Number(rawAddress.repo) || DEFAULT_ADDRESS.repo, BOUNDS.repo.min, BOUNDS.repo.max),
    branch: clamp(Number(rawAddress.branch) || DEFAULT_ADDRESS.branch, BOUNDS.branch.min, BOUNDS.branch.max),
    folder: clamp(Number(rawAddress.folder) || DEFAULT_ADDRESS.folder, BOUNDS.folder.min, BOUNDS.folder.max),
    file: clamp(Number(rawAddress.file) || DEFAULT_ADDRESS.file, BOUNDS.file.min, BOUNDS.file.max),
    lang,
  };
}

// Flattens generated token lines into a plain source string, using the same
// two-space indent convention as renderLinesInto. Tokens already embed their
// own inter-token spacing, so segments join with no separator. Used to feed
// the runner (see runner.js).
export function linesToSource(lines) {
  return lines
    .map((line) => "  ".repeat(line.indentLevel) + line.segments.map((segment) => segment.text).join(""))
    .join("\n");
}

// Renders generated token lines into a container element. Shared by the
// viewer (full file) and the browse "spine" previews (truncated).
export function renderLinesInto(container, lines, maxLines = Infinity) {
  container.innerHTML = "";

  const visible = Number.isFinite(maxLines) ? lines.slice(0, maxLines) : lines;

  visible.forEach((line) => {
    const row = document.createElement("div");
    row.className = "code-line";

    const content = document.createElement("div");
    content.className = "code-content";
    content.append(document.createTextNode("  ".repeat(line.indentLevel)));

    line.segments.forEach((segment) => {
      const span = document.createElement("span");
      span.className = `token-${segment.type}`;
      span.textContent = segment.text;
      content.append(span);
    });

    row.append(content);
    container.append(row);
  });
}
