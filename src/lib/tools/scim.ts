import { result, required, type Run } from "./types";
// Recursive-descent validator for RFC 7644 section 3.4.2.2 filter grammar.
export const scim: Run = (input) => {
  required(input);
  if (input.length > 10000) throw Error("Filter exceeds 10,000 characters.");
  const tokens: string[] = [];
  const re =
    /\s*("(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[\da-fA-F]{4}))*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|[A-Za-z_][\w:.$-]*|[()[\]])/gy;
  let offset = 0;
  while (offset < input.length) {
    if (!input.slice(offset).trim()) break;
    re.lastIndex = offset;
    const m = re.exec(input);
    if (!m) throw Error(`Unexpected character at position ${offset + 1}.`);
    tokens.push(m[1]);
    offset = re.lastIndex;
  }
  let n = 0,
    depth = 0;
  const peek = () => tokens[n]?.toLowerCase();
  const take = (s: string) => {
    if (peek() !== s) throw Error(`Expected ${s} at token ${n + 1}.`);
    n++;
  };
  const attr = (v: string | undefined) =>
    !!v &&
    /^(?:urn:[\w:.-]+:)?[A-Za-z_][\w$-]*(?:\.[A-Za-z_][\w$-]*)?$/.test(v) &&
    !["and", "or", "not", "true", "false", "null"].includes(v.toLowerCase());
  function expression() {
    term();
    while (peek() === "or") {
      n++;
      term();
    }
  }
  function term() {
    factor();
    while (peek() === "and") {
      n++;
      factor();
    }
  }
  function factor() {
    if (++depth > 40) throw Error("Filter nesting exceeds 40 levels.");
    if (peek() === "not") {
      n++;
      take("(");
      expression();
      take(")");
    } else if (peek() === "(") {
      n++;
      expression();
      take(")");
    } else {
      if (!attr(tokens[n]))
        throw Error(`Expected attribute at token ${n + 1}.`);
      n++;
      if (peek() === "[") {
        n++;
        expression();
        take("]");
      } else {
        const op = peek();
        if (op === "pr") n++;
        else {
          if (
            !["eq", "ne", "co", "sw", "ew", "gt", "ge", "lt", "le"].includes(op)
          )
            throw Error(`Expected comparison operator at token ${n + 1}.`);
          n++;
          const value = tokens[n++];
          if (!value || !/^(?:"|true$|false$|null$|-?\d)/.test(value))
            throw Error(`Expected JSON comparison value at token ${n}.`);
          try {
            JSON.parse(value);
          } catch {
            throw Error("Invalid JSON comparison value.");
          }
        }
      }
    }
    depth--;
  }
  expression();
  if (n !== tokens.length)
    throw Error(`Unexpected token ${tokens[n]} at position ${n + 1}.`);
  return result({ valid: true, tokens, standard: "SCIM 2.0 / RFC 7644" });
};
