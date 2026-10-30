import { inflateSync } from "fflate";
import { Decoder } from "cbor-x";
import { XMLParser } from "fast-xml-parser";
import { decodeBase64, decodeBytes } from "./encoding";
import { decodeToken, bytesHex, bytesB64, digest } from "./crypto";
import { formatXML, parseJSON } from "./data";
import { result, required, type Run } from "./types";
export const oauth: Run = (i) => {
  const u = new URL(required(i));
  if (!["https:", "http:"].includes(u.protocol))
    throw Error("Expected an HTTP authorization or callback URL.");
  const params = new URLSearchParams(u.search);
  const fragment = new URLSearchParams(u.hash.slice(1));
  fragment.forEach((v, k) => params.append(k, v));
  const warnings: string[] = [];
  if (u.protocol !== "https:")
    warnings.push("Use HTTPS outside localhost development.");
  if (params.get("response_type")?.includes("token"))
    warnings.push(
      "Implicit tokens in URLs can leak; prefer authorization code with PKCE.",
    );
  if (params.has("client_secret"))
    warnings.push("A client secret must never appear in an authorization URL.");
  if (params.has("response_type") && !params.has("state"))
    warnings.push(
      "Missing state: bind the callback to the initiating session.",
    );
  if (
    params.get("response_type") === "code" &&
    params.get("code_challenge_method") !== "S256"
  )
    warnings.push("Use PKCE S256 for authorization code requests.");
  return result({
    endpoint: u.origin + u.pathname,
    parameters: Object.fromEntries(params),
    duplicates: [...new Set([...params.keys()])].filter(
      (k) => params.getAll(k).length > 1,
    ),
    warnings,
    error: params.get("error"),
    errorDescription: params.get("error_description"),
  });
};
export const jwks: Run = (i) => {
  const v = parseJSON(i) as { keys?: Record<string, unknown>[] };
  if (!v || !Array.isArray(v.keys) || !v.keys.length)
    throw Error("JWKS must contain a non-empty keys array.");
  const seen = new Set();
  return result(
    v.keys.map((k, n) => {
      if (!k || typeof k !== "object" || typeof k.kty !== "string")
        throw Error(`Key ${n + 1} requires kty.`);
      if (["d", "p", "q", "dp", "dq", "qi", "k"].some((f) => f in k))
        throw Error(
          "Private or symmetric key material detected. Use public keys only.",
        );
      if (
        (k.kty === "RSA" && (!k.n || !k.e)) ||
        (k.kty === "EC" && (!k.crv || !k.x || !k.y)) ||
        (k.kty === "OKP" && (!k.crv || !k.x))
      )
        throw Error(`Key ${n + 1} lacks required public parameters.`);
      const duplicate = seen.has(k.kid);
      seen.add(k.kid);
      return {
        ...k,
        warnings: [
          ...(!k.kid ? ["Missing key ID."] : []),
          ...(duplicate ? ["Duplicate key ID."] : []),
        ],
      };
    }),
  );
};
export const oidc: Run = (i) => {
  const v = parseJSON(i) as Record<string, unknown>;
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    typeof v.issuer !== "string"
  )
    throw Error("Metadata requires an issuer URL.");
  const fields = [
    "issuer",
    "authorization_endpoint",
    "token_endpoint",
    "jwks_uri",
    "userinfo_endpoint",
    "end_session_endpoint",
  ];
  const warnings: string[] = [];
  for (const f of fields)
    if (v[f] !== undefined) {
      if (typeof v[f] !== "string") throw Error(`${f} must be a URL string.`);
      const u = new URL(v[f] as string);
      if (u.protocol !== "https:" || u.username || u.password || u.hash)
        warnings.push(`${f} must use HTTPS without credentials or fragments.`);
    }
  const issuer = new URL(v.issuer);
  if (issuer.search) warnings.push("Issuer must not contain a query string.");
  for (const k of [
    "response_types_supported",
    "subject_types_supported",
    "id_token_signing_alg_values_supported",
  ]) {
    if (
      !Array.isArray(v[k]) ||
      (v[k] as unknown[]).some((x) => typeof x !== "string")
    )
      throw Error(`${k} must be an array of strings.`);
  }
  if (!v.jwks_uri) warnings.push("Missing jwks_uri.");
  return result({
    metadata: v,
    warnings,
    explanations: {
      issuer: "Must exactly match the issuer in validated ID tokens.",
      jwks_uri: "Public verification keys; validate algorithms independently.",
      token_endpoint:
        "Authorization codes and client credentials are exchanged here.",
      scopes_supported:
        "Advertised scopes; consent and policy can still restrict grants.",
    },
  });
};
export const saml: Run = (i) => {
  required(i);
  let xml = i.trim();
  if (!xml.startsWith("<")) {
    if (/^https?:/.test(xml)) {
      const u = new URL(xml);
      xml =
        u.searchParams.get("SAMLResponse") ||
        u.searchParams.get("SAMLRequest") ||
        "";
    } else if (/^(SAMLRequest|SAMLResponse)=/.test(xml)) {
      const p = new URLSearchParams(xml);
      xml = p.get("SAMLResponse") || p.get("SAMLRequest") || "";
    } else if (xml.includes("%")) xml = decodeURIComponent(xml);
    const bytes = decodeBytes(xml);
    try {
      xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (!xml.trim().startsWith("<")) throw Error();
    } catch {
      const inflated = inflateSync(bytes, { out: new Uint8Array(1_000_001) });
      if (inflated.length > 1_000_000)
        throw Error("Inflated SAML exceeds 1 MB.");
      xml = new TextDecoder("utf-8", { fatal: true }).decode(inflated);
    }
  }
  const pretty = formatXML(xml);
  const parsed = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    processEntities: false,
  }).parse(xml);
  const collected: Record<string, unknown[]> = {};
  function walk(v: unknown) {
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (
        [
          "Issuer",
          "NameID",
          "Audience",
          "Conditions",
          "SubjectConfirmationData",
          "Attribute",
          "AuthnStatement",
        ].includes(k)
      )
        (collected[k] ??= []).push(x);
      walk(x);
    }
  }
  walk(parsed);
  return result(
    `XML signature validated: NO\n\n${JSON.stringify(collected, null, 2)}\n\n${pretty}`,
    "xml",
  );
};
export const scopes: Run = (i, o, s) => {
  required(i, "Requested scopes");
  required(s, "Granted scopes");
  const splitter =
    o.delimiter === "," ? "," : o.delimiter === ";" ? ";" : /\s+/;
  function split(value: string) {
    if (/^eyJ[\w-]*\.[\w-]+\.[\w-]*$/.test(value)) {
      const p = decodeToken(value).payload;
      value = Array.isArray(p.scp)
        ? p.scp.join(" ")
        : String(p.scope || p.scp || "");
    }
    return [
      ...new Set(
        value
          .split(splitter)
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ];
  }
  const requested = split(i),
    granted = split(s);
  return result({
    requested,
    granted,
    missing: requested.filter((x) => !granted.includes(x)),
    additional: granted.filter((x) => !requested.includes(x)),
    common: requested.filter((x) => granted.includes(x)),
  });
};
export const iam: Run = (i) => {
  const p = parseJSON(i) as Record<string, unknown>;
  if (!p || typeof p !== "object" || Array.isArray(p))
    throw Error("Policy must be an object.");
  if (
    p.Version !== undefined &&
    !["2012-10-17", "2008-10-17"].includes(String(p.Version))
  )
    throw Error("Unsupported policy Version.");
  const statements = Array.isArray(p.Statement) ? p.Statement : [p.Statement];
  if (!statements.length) throw Error("Policy must have statements.");
  const warnings: string[] = [];
  function strings(v: unknown, label: string) {
    if (typeof v === "string" && v.length) return [v];
    if (
      Array.isArray(v) &&
      v.length &&
      v.every((x) => typeof x === "string" && x.length)
    )
      return v as string[];
    throw Error(`${label} must be a string or non-empty string array.`);
  }
  statements.forEach((s, n) => {
    if (!s || typeof s !== "object" || Array.isArray(s))
      throw Error("Each Statement must be an object.");
    const v = s as Record<string, unknown>;
    if (!["Allow", "Deny"].includes(String(v.Effect)))
      throw Error(`Statement ${n + 1}: Effect must be Allow or Deny.`);
    if (!!v.Action === !!v.NotAction)
      throw Error("Provide exactly one of Action or NotAction.");
    if (!!v.Resource === !!v.NotResource)
      throw Error("Provide exactly one of Resource or NotResource.");
    const actions = strings(v.Action || v.NotAction, "Action"),
      resources = strings(v.Resource || v.NotResource, "Resource");
    if (actions.some((a) => a !== "*" && !/^[\w*-]+:[\w*?]+$/.test(a)))
      throw Error("Invalid service:Action syntax.");
    if (
      v.Condition !== undefined &&
      (!v.Condition ||
        typeof v.Condition !== "object" ||
        Array.isArray(v.Condition))
    )
      throw Error("Condition must be an object.");
    if (v.Effect === "Allow") {
      if (actions.some((a) => a.includes("*")))
        warnings.push(`Statement ${n + 1}: wildcard action.`);
      if (resources.includes("*"))
        warnings.push(`Statement ${n + 1}: all resources.`);
      if (v.NotAction || v.NotResource)
        warnings.push(
          `Statement ${n + 1}: negative matching can grant broad access.`,
        );
      if (
        v.Principal === "*" ||
        (v.Principal as Record<string, unknown>)?.AWS === "*"
      )
        warnings.push(`Statement ${n + 1}: public principal.`);
    }
  });
  return result({
    structurallyValid: true,
    statements: statements.length,
    warnings,
    limitation:
      "Local checks are not AWS IAM Access Analyzer and do not calculate effective permissions.",
  });
};
export const webauthn: Run = async (i, o) => {
  required(i);
  if (o.mode === "Attestation object") {
    const decoder = new Decoder({ mapsAsObjects: false, useRecords: false });
    const obj = decoder.decode(decodeBytes(i, true));
    if (!(obj instanceof Map) || !(obj.get("authData") instanceof Uint8Array))
      throw Error("Attestation object requires CBOR authData.");
    const auth = await webauthn(
      bytesB64(obj.get("authData"), true),
      { ...o, mode: "Authenticator data" },
      "",
    );
    return result({
      format: obj.get("fmt"),
      attestationStatement: cborValue(obj.get("attStmt")),
      authenticatorData: JSON.parse(auth.text),
      signatureVerified: false,
    });
  }
  if (o.mode !== "Authenticator data") {
    const v = parseJSON(
      i.trim().startsWith("{") ? i : decodeBase64(i, true),
    ) as Record<string, unknown>;
    if (
      !["webauthn.create", "webauthn.get"].includes(String(v.type)) ||
      typeof v.challenge !== "string" ||
      typeof v.origin !== "string"
    )
      throw Error(
        "Client data requires a WebAuthn type, challenge and origin.",
      );
    decodeBytes(v.challenge, true);
    const origin = new URL(v.origin);
    return result({
      ...v,
      originHost: origin.hostname,
      expectedRpId: o.rpId || null,
      rpIdCompatible: o.rpId
        ? origin.hostname === o.rpId || origin.hostname.endsWith("." + o.rpId)
        : null,
      signatureVerified: false,
    });
  }
  const b = decodeBytes(i, true);
  if (b.length < 37)
    throw Error("Authenticator data must be at least 37 bytes.");
  const f = b[32];
  let offset = 37;
  let structures: unknown[] = [];
  let extensions: unknown = null;
  let credential: unknown = null;
  if (f & 64) {
    if (b.length < 55) throw Error("Attested credential data is truncated.");
    const length = (b[53] << 8) | b[54];
    if (b.length < 55 + length + 1)
      throw Error("Credential ID or public key is truncated.");
    structures = new Decoder({
      mapsAsObjects: false,
      useRecords: false,
    }).decodeMultiple(b.slice(55 + length)) as unknown[];
    if (!structures.length || !(structures[0] instanceof Map))
      throw Error("Expected a CBOR COSE public key map.");
    credential = {
      aaguid: bytesHex(b.slice(37, 53)),
      credentialId: bytesHex(b.slice(55, 55 + length)),
      publicKeyCOSE: cborValue(structures[0]),
    };
    offset = 55 + length;
  }
  if (f & 128) {
    if (!(f & 64))
      structures = new Decoder({
        mapsAsObjects: false,
        useRecords: false,
      }).decodeMultiple(b.slice(offset)) as unknown[];
    extensions = cborValue(structures[f & 64 ? 1 : 0]);
    if (extensions === undefined)
      throw Error("Extension flag set without extension data.");
  }
  if (!(f & 64) && !(f & 128) && b.length !== 37)
    throw Error("Unexpected trailing authenticator bytes.");
  const expected = o.rpId
    ? bytesHex(await digest(new TextEncoder().encode(o.rpId)))
    : null;
  return result({
    rpIdHash: bytesHex(b.slice(0, 32)),
    expectedRpId: o.rpId || null,
    rpIdHashMatches: expected ? expected === bytesHex(b.slice(0, 32)) : null,
    flags: {
      userPresent: !!(f & 1),
      userVerified: !!(f & 4),
      backupEligible: !!(f & 8),
      backupState: !!(f & 16),
      attestedCredentialData: !!(f & 64),
      extensionData: !!(f & 128),
    },
    signCount: new DataView(b.buffer, b.byteOffset + 33, 4).getUint32(0),
    credential,
    extensions,
    warnings: [
      ...(f & 16 && !(f & 8)
        ? ["Backup state set without backup eligibility."]
        : []),
      ...(f & 34 ? ["Reserved flag bits are set."] : []),
    ],
    signatureVerified: false,
  });
};
function cborValue(v: unknown): unknown {
  if (v instanceof Uint8Array) return { hex: bytesHex(v) };
  if (v instanceof Map)
    return Object.fromEntries(
      [...v].map(([k, x]) => [String(k), cborValue(x)]),
    );
  if (Array.isArray(v)) return v.map(cborValue);
  if (typeof v === "bigint") return v.toString();
  return v;
}
