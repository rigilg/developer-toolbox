import { encode as escape, decode as unescape } from "he";
import { required, result, type Run } from "./types";
// Adapted from rigilg/base64-tool/codec.js: preserve canonical UTF-8 checks.
export function encodeBase64(text: string, urlSafe = false) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const value = btoa(binary);
  return urlSafe
    ? value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : value;
}
export function decodeBytes(text: string, urlSafe = false) {
  let value = text.replace(/\s/g, "");
  if (
    !(urlSafe ? /^[A-Za-z0-9_-]*={0,2}$/ : /^[A-Za-z0-9+/]*={0,2}$/).test(value)
  )
    throw Error("Invalid Base64 characters. Check the alphabet setting.");
  const raw = value.replace(/=+$/, "");
  const pad = value.length - raw.length;
  if (
    raw.length % 4 === 1 ||
    (pad > 0 && (value.length % 4 !== 0 || pad !== (4 - (raw.length % 4)) % 4))
  )
    throw Error("Invalid Base64 length or padding.");
  value = raw.replace(/-/g, "+").replace(/_/g, "/");
  value += "=".repeat((4 - (value.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  if (
    btoa(binary).replace(/=+$/, "") !==
    raw.replace(/-/g, "+").replace(/_/g, "/")
  )
    throw Error("Non-canonical Base64 input.");
  return bytes;
}
export function decodeBase64(text: string, urlSafe = false) {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      decodeBytes(text, urlSafe),
    );
  } catch (e) {
    if (e instanceof TypeError)
      throw Error("Decoded data is not valid UTF-8 text.");
    throw e;
  }
}
export const base64: Run = (i, o) =>
  result(
    o.mode === "Decode"
      ? decodeBase64(required(i), o.urlSafe === "URL-safe")
      : encodeBase64(required(i), o.urlSafe === "URL-safe"),
    "text",
  );
export const url: Run = (i, o) => {
  required(i);
  if (o.mode === "Parse query") {
    const query = i.includes("?") ? new URL(i).search : i.replace(/^\?/, "");
    const data: Record<string, string[]> = Object.create(null);
    new URLSearchParams(query).forEach((v, k) => (data[k] ??= []).push(v));
    return result(data);
  }
  return result(
    o.mode === "Decode" ? decodeURIComponent(i) : encodeURIComponent(i),
    "text",
  );
};
export const html: Run = (i, o) =>
  result(
    o.mode === "Decode"
      ? unescape(required(i))
      : escape(required(i), { useNamedReferences: true }),
    "text",
  );
export const textCase: Run = (i, o) => {
  required(i);
  const words = i
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return result(
    o.mode === "UPPERCASE"
      ? i.toUpperCase()
      : o.mode === "lowercase"
        ? i.toLowerCase()
        : o.mode === "Title Case"
          ? words.map(cap).join(" ")
          : o.mode === "camelCase"
            ? words.map((w, n) => (n ? cap(w) : w)).join("")
            : o.mode === "PascalCase"
              ? words.map(cap).join("")
              : o.mode === "snake_case"
                ? words.join("_")
                : o.mode === "CONSTANT_CASE"
                  ? words.join("_").toUpperCase()
                  : words.join("-"),
    "text",
  );
};
