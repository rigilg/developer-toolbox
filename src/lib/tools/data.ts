import { parseDocument, stringify } from "yaml";
import Papa from "papaparse";
import { format, type SqlLanguage } from "sql-formatter";
import { XMLValidator, XMLParser, XMLBuilder } from "fast-xml-parser";
import { JSONPath } from "jsonpath-plus";
import { diffLines } from "diff";
import {
  parse as parseWithErrors,
  printParseErrorCode,
  type ParseError,
} from "jsonc-parser";
import { required, result, type Run } from "./types";
export function parseJSON(input: string): unknown {
  required(input);
  try {
    return JSON.parse(input);
  } catch (e) {
    const message = (e as Error).message;
    const errors: ParseError[] = [];
    parseWithErrors(input, errors, {
      allowTrailingComma: false,
      disallowComments: true,
    });
    const offset = errors[0]?.offset ?? 0;
    const prefix = input.slice(0, offset);
    const line = prefix.split("\n").length;
    const column = offset - (prefix.lastIndexOf("\n") + 1) + 1;
    throw Error(
      `JSON error at line ${line}, column ${column}: ${errors.length ? printParseErrorCode(errors[0].error) : message}`,
    );
  }
}
export const json: Run = (i, o) => {
  const value = parseJSON(i);
  return result(
    o.mode === "Validate"
      ? "Valid JSON."
      : JSON.stringify(
          value,
          null,
          o.mode === "Minify"
            ? 0
            : o.indent === "tab"
              ? "\t"
              : Number(o.indent || 2),
        ),
    "json",
  );
};
export const yaml: Run = (i, o) => {
  if (o.mode === "YAML to JSON") {
    required(i);
    const doc = parseDocument(i, { uniqueKeys: true });
    if (doc.errors.length) throw Error(doc.errors[0].message);
    const value = doc.toJS({ maxAliasCount: 50 });
    function check(v: unknown) {
      if (typeof v === "number" && !Number.isFinite(v))
        throw Error("JSON cannot represent non-finite YAML numbers.");
      if (typeof v === "bigint" || v instanceof Map || v instanceof Set)
        throw Error("YAML value is not representable in JSON.");
      if (v && typeof v === "object") Object.values(v).forEach(check);
    }
    check(value);
    return result(value);
  }
  return result(stringify(parseJSON(i)), "yaml");
};
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => [k, canonical(x)]),
    );
  return v;
}
export const diff: Run = (i, o, s) => {
  required(i, "Left input");
  required(s, "Right input");
  const left =
    o.mode === "Semantic JSON"
      ? JSON.stringify(canonical(parseJSON(i)), null, 2)
      : i;
  const right =
    o.mode === "Semantic JSON"
      ? JSON.stringify(canonical(parseJSON(s)), null, 2)
      : s;
  const changes = diffLines(left, right);
  return {
    ...result(
      changes.every((c) => !c.added && !c.removed)
        ? "Inputs are equal."
        : changes
            .map((c) => `${c.added ? "+" : c.removed ? "-" : " "} ${c.value}`)
            .join(""),
      "diff",
    ),
    highlights: changes.map((c) => ({
      value: c.value,
      kind: c.added
        ? ("added" as const)
        : c.removed
          ? ("removed" as const)
          : ("same" as const),
    })),
  };
};
export const sql: Run = (i, o) => {
  required(i);
  const formatted = format(i, {
    language: (o.dialect || "sql") as SqlLanguage,
    tabWidth: Number(o.indent || 2),
    keywordCase: (o.case || "upper") as "upper" | "lower" | "preserve",
  });
  if (o.mode !== "Minify") return result(formatted, "sql"); // Tokenize strings/comments before removing whitespace.
  const tokens =
    formatted.match(
      /'(?:''|[^'])*'|"(?:""|[^"])*"|`[^`]*`|\[(?:[^\]]|\]\])*\]|\$\w*\$[\s\S]*?\$\w*\$|--[^\n]*|\/\*[\s\S]*?\*\/|\s+|[^\s'"`[/$-]+|./g,
    ) || [];
  return result(
    tokens
      .map((t) => (/^--|^\/\*/.test(t) ? " " : /^\s+$/.test(t) ? " " : t))
      .join("")
      .trim(),
    "sql",
  );
};
export function formatXML(input: string) {
  required(input);
  if (/<!\s*(?:DOCTYPE|ENTITY)/i.test(input))
    throw Error("DOCTYPE and entity declarations are disabled.");
  const validation = XMLValidator.validate(input);
  if (validation !== true)
    throw Error(`XML line ${validation.err.line}: ${validation.err.msg}`);
  const parsed = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    processEntities: false,
    trimValues: false,
  }).parse(input);
  return new XMLBuilder({
    preserveOrder: true,
    ignoreAttributes: false,
    format: true,
    processEntities: false,
  }).build(parsed) as string;
}
export const xml: Run = (i) => result(formatXML(i), "xml");
export const jsonpath: Run = (i, o) => {
  const path = required(o.path || "", "JSONPath");
  try {
    return result(
      JSONPath({ path, json: parseJSON(i) as object, eval: false }),
    );
  } catch (e) {
    throw Error(`JSONPath: ${(e as Error).message}`);
  }
};
export const csv: Run = (i, o) => {
  const delimiter = o.delimiter === "tab" ? "\t" : o.delimiter || ",";
  if (o.mode === "CSV to JSON") {
    required(i);
    const parsed = Papa.parse(i, {
      delimiter,
      header: o.headers !== "No",
      skipEmptyLines: true,
    });
    if (parsed.errors.length)
      throw Error(
        parsed.errors
          .map((e) => `Row ${(e.row ?? 0) + 1}: ${e.message}`)
          .join("\n"),
      );
    return result(parsed.data);
  }
  const data = parseJSON(i);
  if (
    !Array.isArray(data) ||
    !data.length ||
    data.some((v) => !v || typeof v !== "object" || Array.isArray(v))
  )
    throw Error("Provide a non-empty array of objects.");
  const rows = data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k,
        v && typeof v === "object" ? JSON.stringify(v) : v,
      ]),
    ),
  );
  return result(
    Papa.unparse(rows, {
      delimiter,
      header: o.headers !== "No",
      escapeFormulae: true,
    }),
    "csv",
  );
};
