import type { Run } from "./types";
const runners: Record<string, () => Promise<Run>> = {
  "json-formatter": () => import("./data").then((m) => m.json),
  "json-yaml-converter": () => import("./data").then((m) => m.yaml),
  "diff-checker": () => import("./data").then((m) => m.diff),
  "sql-formatter": () => import("./data").then((m) => m.sql),
  "xml-formatter": () => import("./data").then((m) => m.xml),
  "jsonpath-tester": () => import("./data").then((m) => m.jsonpath),
  "json-csv-converter": () => import("./data").then((m) => m.csv),
  "json-to-java": () => import("./models").then((m) => m.java),
  "json-to-typescript": () => import("./models").then((m) => m.typescript),
  "regex-tester": () => import("./regex").then((m) => m.regex),
  base64: () => import("./encoding").then((m) => m.base64),
  "url-encoder": () => import("./encoding").then((m) => m.url),
  "html-encoder": () => import("./encoding").then((m) => m.html),
  "text-case-converter": () => import("./encoding").then((m) => m.textCase),
  "jwt-decoder": () => import("./crypto").then((m) => m.jwtDecode),
  "jwt-verifier": () => import("./crypto").then((m) => m.jwtVerify),
  "hash-generator": () => import("./crypto").then((m) => m.hash),
  "pkce-generator": () => import("./crypto").then((m) => m.pkce),
  "jwk-pem-converter": () => import("./crypto").then((m) => m.jwkPem),
  "webhook-signature-verifier": () => import("./crypto").then((m) => m.webhook),
  "oauth-debugger": () => import("./identity").then((m) => m.oauth),
  "jwks-explorer": () => import("./identity").then((m) => m.jwks),
  "oidc-discovery": () => import("./identity").then((m) => m.oidc),
  "saml-decoder": () => import("./identity").then((m) => m.saml),
  "oauth-scope-analyzer": () => import("./identity").then((m) => m.scopes),
  "scim-filter-validator": () => import("./scim").then((m) => m.scim),
  "aws-iam-policy-validator": () => import("./identity").then((m) => m.iam),
  "webauthn-debugger": () => import("./identity").then((m) => m.webauthn),
  "http-header-analyzer": () => import("./network").then((m) => m.headers),
  "cors-debugger": () => import("./network").then((m) => m.cors),
  "http-to-curl": () => import("./network").then((m) => m.curl),
  "subnet-calculator": () => import("./network").then((m) => m.subnet),
  "timestamp-converter": () => import("./generators").then((m) => m.timestamp),
  "cron-generator": () => import("./generators").then((m) => m.cron),
  "uuid-generator": () => import("./generators").then((m) => m.uuid),
  "password-generator": () => import("./generators").then((m) => m.password),
  "ssl-certificate-inspector": async () => async (input) => {
    const r = await fetch("/api/certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname: input }),
      cache: "no-store",
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error || "Certificate inspection failed.");
    return { text: JSON.stringify(data, null, 2), language: "json" };
  },
};
export async function getRunner(slug: string) {
  if (!runners[slug]) throw Error("Unknown tool.");
  return runners[slug]();
}
