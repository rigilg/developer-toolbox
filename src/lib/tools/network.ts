import { required, result, type Run } from "./types";
export function parseHeaders(input: string) {
  required(input);
  const headers: Record<string, string> = Object.create(null);
  for (const line of input.split(/\r?\n/)) {
    if (!line.trim() || /^HTTP\/\d(?:\.\d)?\s+\d{3}/i.test(line)) continue;
    const index = line.indexOf(":");
    if (index < 1) throw Error(`Invalid header line: ${line.slice(0, 80)}`);
    const name = line.slice(0, index).trim().toLowerCase();
    if (!/^[!#$%&'*+.^_`|~\w-]+$/.test(name))
      throw Error("Invalid header name.");
    const value = line.slice(index + 1).trim();
    headers[name] = headers[name] ? headers[name] + ", " + value : value;
  }
  if (!Object.keys(headers).length) throw Error("No headers were found.");
  return headers;
}
export const headers: Run = (i) => {
  const h = parseHeaders(i);
  const warnings: string[] = [];
  for (const key of [
    "content-security-policy",
    "strict-transport-security",
    "x-content-type-options",
    "referrer-policy",
  ])
    if (!h[key]) warnings.push(`Missing ${key}.`);
  if (h["x-content-type-options"] && h["x-content-type-options"] !== "nosniff")
    warnings.push("Use X-Content-Type-Options: nosniff.");
  if (
    h["strict-transport-security"] &&
    !/max-age=\d+/i.test(h["strict-transport-security"])
  )
    warnings.push("HSTS needs a numeric max-age.");
  if (
    h["content-security-policy"] &&
    /unsafe-eval|unsafe-inline|\*/.test(h["content-security-policy"])
  )
    warnings.push(
      "CSP has broad or unsafe sources; review script restrictions.",
    );
  if (
    h["access-control-allow-origin"] === "*" &&
    h["access-control-allow-credentials"] === "true"
  )
    warnings.push(
      "Wildcard origins cannot be combined with credentialed CORS.",
    );
  return result({
    headers: h,
    warnings,
    cacheControl: (h["cache-control"] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    explanations: {
      "content-security-policy":
        "Restricts resource origins and script execution.",
      "strict-transport-security":
        "Instructs browsers to use HTTPS after the first secure visit.",
      "x-content-type-options": "nosniff prevents MIME-type guessing.",
      "cache-control":
        "Controls browser and intermediary caching; no-store prevents storage.",
      "access-control-allow-origin":
        "Controls which browser origins can read the response.",
    },
  });
};
export const cors: Run = (i, o) => {
  const h = parseHeaders(i);
  const origin = required(o.origin || "", "Origin");
  const u = new URL(origin);
  if (u.origin !== origin)
    throw Error("Origin must contain scheme and host only.");
  const method = (o.method || "GET").toUpperCase();
  if (!/^[A-Z]+$/.test(method)) throw Error("Invalid method.");
  const names = (o.headers || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const credentials = o.credentials === "Yes";
  const allowedOrigin = h["access-control-allow-origin"];
  const originOK =
    allowedOrigin === origin || (allowedOrigin === "*" && !credentials);
  const allowedMethods = (h["access-control-allow-methods"] || "")
    .split(",")
    .map((x) => x.trim());
  const allowedHeaders = (h["access-control-allow-headers"] || "")
    .toLowerCase()
    .split(",")
    .map((x) => x.trim());
  const preflight =
    !["GET", "HEAD", "POST"].includes(method) ||
    names.some(
      (n) => !["accept", "accept-language", "content-language"].includes(n),
    );
  const methodOK =
    !preflight ||
    allowedMethods.includes(method) ||
    (allowedMethods.includes("*") && !credentials);
  const missing = preflight
    ? names.filter(
        (n) =>
          !allowedHeaders.includes(n) &&
          !(
            allowedHeaders.includes("*") &&
            !credentials &&
            n !== "authorization"
          ),
      )
    : [];
  const credentialsOK =
    !credentials || h["access-control-allow-credentials"] === "true";
  return result({
    originAllowed: originOK,
    methodAllowed: methodOK,
    missingAllowedHeaders: missing,
    credentialsAllowed: credentialsOK,
    preflightRequired: preflight,
    compatible: originOK && methodOK && !missing.length && credentialsOK,
    limitation:
      "Header-name simulation is conservative: content-type triggers preflight because its value is not supplied. Actual browser enforcement also depends on header values and response status.",
  });
};
const quote = (s: string) => "'" + s.replace(/'/g, "'\"'\"'") + "'";
export const curl: Run = (i) => {
  required(i);
  const [head, ...body] = i.replace(/\r\n/g, "\n").split("\n\n");
  const [first, ...lines] = head.split("\n");
  const match = /^([A-Za-z]+)\s+(\S+)(?:\s+HTTP\/\d(?:\.\d)?)?$/.exec(first);
  if (!match)
    throw Error("First line must be METHOD https://host/path HTTP/1.1.");
  const u = new URL(match[2]);
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
    throw Error("Use an HTTP(S) URL without embedded credentials.");
  const h = lines.length ? parseHeaders(lines.join("\n")) : {};
  return result(
    [
      "curl",
      "--request",
      quote(match[1].toUpperCase()),
      "--url",
      quote(u.toString()),
      ...Object.entries(h).flatMap(([k, v]) => [
        "--header",
        quote(`${k}: ${v}`),
      ]),
      ...(body.length ? ["--data-raw", quote(body.join("\n\n"))] : []),
    ].join(" "),
    "bash",
  );
};
function ip(value: number) {
  return [
    value >>> 24,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join(".");
}
export const subnet: Run = (i) => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(
    required(i).trim(),
  );
  if (!m || m.slice(1, 5).some((v) => +v > 255) || +m[5] > 32)
    throw Error("Use IPv4/CIDR, for example 192.168.1.42/24.");
  const prefix = +m[5];
  const address = m
    .slice(1, 5)
    .reduce((v, x) => (v * 256 + Number(x)) >>> 0, 0);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (address & mask) >>> 0;
  const count = 2 ** (32 - prefix);
  const broadcast = network + count - 1;
  return result({
    cidr: `${ip(network)}/${prefix}`,
    subnetMask: ip(mask),
    wildcardMask: ip(~mask >>> 0),
    network: ip(network),
    broadcast: ip(broadcast),
    addresses: count,
    firstAddress: ip(network),
    lastAddress: ip(broadcast),
    usableHosts: prefix >= 31 ? count : count - 2,
    firstUsable: ip(prefix >= 31 ? network : network + 1),
    lastUsable: ip(prefix >= 31 ? broadcast : broadcast - 1),
    note:
      prefix === 31
        ? "RFC 3021 point-to-point subnet."
        : prefix === 32
          ? "Single host route."
          : "Network and broadcast excluded from usable hosts.",
  });
};
