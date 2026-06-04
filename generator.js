// Shared deterministic code generator for the Repo of Babel.
// An address (repo/branch/folder/file/lang) seeds an RNG that always
// produces the same "file", so any coordinate is permanently browsable.

export const LANGUAGE_DEFS = {
  python: {
    label: "Python",
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

function renderTemplate(template, def, random) {
  if (def === LANGUAGE_DEFS.python) {
    return pythonLine(template, def, random);
  }

  return javascriptLine(template, def, random);
}

function shouldIncreaseIndent(segments, def) {
  const text = segments.map((segment) => segment.text).join("");
  return def.blockOpeners.some((opener) => text.startsWith(opener)) && /(:|\{)\s*$/.test(text);
}

function closingLine(def) {
  if (def === LANGUAGE_DEFS.javascript) {
    return [punctuation("}")];
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
