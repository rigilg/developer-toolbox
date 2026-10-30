import { parseJSON } from "./data";
import { result, type Run } from "./types";
const identifier = (s: string) => /^[A-Za-z_$][\w$]*$/.test(s);
const javaReserved = new Set(
  "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while record var null true false".split(
    " ",
  ),
);
const pascal = (s: string) =>
  s
    .replace(/[^\w$]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join("")
    .replace(/^\d/, "N$&") || "Item";
function objects(v: unknown): Record<string, unknown>[] {
  const list = Array.isArray(v) ? v : [v];
  if (
    !list.length ||
    list.some((x) => !x || typeof x !== "object" || Array.isArray(x))
  )
    throw Error("Use an object or a non-empty array of objects.");
  return list as Record<string, unknown>[];
}
export const typescript: Run = (input, o) => {
  const root = o.name || "Root";
  if (!identifier(root)) throw Error("Invalid TypeScript type name.");
  const declarations: string[] = [];
  const used = new Set<string>();
  function model(rows: Record<string, unknown>[], suggested: string): string {
    let name = suggested;
    while (used.has(name)) name += "Item";
    used.add(name);
    const keys = [...new Set(rows.flatMap(Object.keys))];
    const body = keys
      .map((k) => {
        const present = rows.filter((r) => Object.hasOwn(r, k));
        return `  ${JSON.stringify(k)}${present.length < rows.length ? "?" : ""}: ${infer(
          present.map((r) => r[k]),
          pascal(k),
        )};`;
      })
      .join("\n");
    declarations.push(
      o.mode === "type"
        ? `export type ${name} = {\n${body}\n};`
        : `export interface ${name} {\n${body}\n}`,
    );
    return name;
  }
  function infer(values: unknown[], name: string): string {
    const types: string[] = [];
    const objs = values.filter(
      (v) => v && typeof v === "object" && !Array.isArray(v),
    ) as Record<string, unknown>[];
    if (objs.length) types.push(model(objs, name));
    const arrays = values.filter(Array.isArray);
    if (arrays.length) {
      const items = arrays.flat();
      types.push(
        `Array<${items.length ? infer(items, name + "Item") : "unknown"}>`,
      );
    }
    for (const v of values) {
      if (v === null) types.push("null");
      else if (typeof v !== "object") types.push(typeof v);
    }
    return [...new Set(types)].join(" | ") || "unknown";
  }
  model(objects(parseJSON(input)), root);
  return result(declarations.reverse().join("\n\n"), "typescript");
};
export const java: Run = (input, o) => {
  const root = o.name || "Root";
  const pkg = o.package || "";
  if (
    !identifier(root) ||
    javaReserved.has(root) ||
    (pkg && pkg.split(".").some((p) => !identifier(p) || javaReserved.has(p)))
  )
    throw Error("Invalid Java class name or package.");
  const classes: string[] = [];
  const used = new Set<string>();
  function model(rows: Record<string, unknown>[], suggested: string) {
    let name = pascal(suggested);
    while (used.has(name)) name += "Item";
    used.add(name);
    const keys = [...new Set(rows.flatMap(Object.keys))];
    const names = new Set<string>();
    const fields = keys.map((k) => {
      if (!identifier(k) || javaReserved.has(k))
        throw Error(
          `JSON property ${JSON.stringify(k)} is not a valid Java field name. Rename the property first.`,
        );
      if (names.has(k)) throw Error("Duplicate field name.");
      names.add(k);
      const value = rows.filter((r) => Object.hasOwn(r, k)).map((r) => r[k]);
      return { name: k, type: infer(value, pascal(k)) };
    });
    const getters =
      o.lombok === "Yes"
        ? ""
        : fields
            .map(
              (f) =>
                `    public ${f.type} get${pascal(f.name)}() { return ${f.name}; }\n    public void set${pascal(f.name)}(${f.type} value) { this.${f.name} = value; }`,
            )
            .join("\n");
    classes.push(
      `${o.lombok === "Yes" ? "@lombok.Data\n" : ""}public ${name === pascal(root) ? "" : "static "}class ${name} {\n${fields.map((f) => `    private ${f.type} ${f.name};`).join("\n")}\n${getters}\n}`,
    );
    return name;
  }
  function infer(values: unknown[], name: string): string {
    const nonnull = values.filter((v) => v !== null);
    if (!nonnull.length) return "Object";
    if (nonnull.every((v) => Array.isArray(v))) {
      const items = (nonnull as unknown[][]).flat();
      return `java.util.List<${items.length ? infer(items, name + "Item") : "Object"}>`;
    }
    if (nonnull.every((v) => typeof v === "object" && !Array.isArray(v)))
      return model(nonnull as Record<string, unknown>[], name);
    if (nonnull.every((v) => typeof v === "string")) return "String";
    if (nonnull.every((v) => typeof v === "boolean")) return "Boolean";
    if (nonnull.every((v) => typeof v === "number"))
      return nonnull.every((v) => Number.isSafeInteger(v)) ? "Long" : "Double";
    return "Object";
  }
  model(objects(parseJSON(input)), root);
  const main = classes.pop()!;
  const nested = classes
    .map((c) =>
      c
        .split("\n")
        .map((l) => "    " + l)
        .join("\n"),
    )
    .join("\n\n");
  return result(
    `${pkg ? `package ${pkg};\n\n` : ""}${main.slice(0, -1)}${nested ? "\n" + nested + "\n" : ""}}`,
    "java",
  );
};
