export type Options = Record<string, string>;
export interface Field {
  key: string;
  label: string;
  default?: string;
  choices?: string[];
  type?: "password" | "number" | "textarea";
  help?: string;
}
export interface ToolDefinition {
  slug: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  icon: string;
  example: string;
  secondary?: string;
  fields?: Field[];
  note?: string;
  language?: string;
  remote?: boolean;
}
export interface ToolResult {
  text: string;
  language?: string;
  highlights?: { value: string; kind: "added" | "removed" | "same" }[];
}
export type Run = (
  input: string,
  options: Options,
  secondary: string,
) => Promise<ToolResult> | ToolResult;
export const result = (value: unknown, language = "json"): ToolResult => ({
  text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
  language,
});
export function required(value: string, name = "Input") {
  if (!value.trim()) throw Error(`${name} is required.`);
  if (value.length > 1_000_000) throw Error(`${name} exceeds the 1 MB limit.`);
  return value;
}
