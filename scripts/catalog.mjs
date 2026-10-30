import { writeFileSync } from "node:fs";
import { tools, categories } from "../src/config/tools.ts";
const lines = [
  "# Tool catalog and implementation status",
  "",
  "All tools have a dedicated `/tools/<slug>` route. Local inputs stay in memory. The shared workbench provides examples, options, output, copy, clear, download and errors. The registry is the source of truth.",
  "",
  "| Utility | Category | Logic | Test coverage | Processing |",
  "| --- | --- | --- | --- | --- |",
];
for (const t of tools)
  lines.push(
    `| [${t.name}](https://toolbox.rigilgilbert.com/tools/${t.slug}) | ${categories.find((c) => c.id === t.category).name} | Implemented | Valid / invalid / edge cases; generators have configuration tests | ${t.remote ? "Server hostname diagnostic" : "Browser"} |`,
  );
lines.push("", "## Tool instructions and examples", "");
for (const t of tools) {
  lines.push(`### ${t.name}`, "Route: /tools/" + t.slug, "", t.description, "");
  if (t.fields?.length)
    lines.push(
      "Controls: " +
        t.fields
          .map(
            (f) =>
              `${f.label}${f.choices ? " (" + f.choices.join(", ") + ")" : ""}`,
          )
          .join("; ") +
        ".",
      "",
    );
  if (t.example) lines.push("```text", t.example, "```", "");
  else
    lines.push(
      "Generate a fresh value or supply the key/token required by the labeled controls. Private-key conversion is not supported.",
      "",
    );
  if (t.secondary)
    lines.push("Second input:", "```text", t.secondary, "```", "");
  if (t.note) lines.push(t.note, "");
}
writeFileSync(
  new URL("../docs/TOOLS.md", import.meta.url),
  lines.join("\n") + "\n",
);
