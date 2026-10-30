import {
  decodeJwt,
  decodeProtectedHeader,
  compactVerify,
  importSPKI,
  importJWK,
  exportSPKI,
  exportJWK,
} from "jose";
import { decodeBytes, decodeBase64 } from "./encoding";
import { required, result, type Run } from "./types";
export const bytesHex = (b: Uint8Array) =>
  Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
export function bytesB64(bytes: Uint8Array, url = false) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const b = btoa(s);
  return url ? b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b;
}
export async function digest(data: Uint8Array, algorithm = "SHA-256") {
  return new Uint8Array(
    await crypto.subtle.digest(algorithm, data as BufferSource),
  );
}
// Retains the original decoder's Bearer prefix, object and JWE validation.
export function decodeToken(input: string) {
  const token = required(input)
    .trim()
    .replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length === 5)
    throw Error("Encrypted JWE requires a decryption key.");
  if (parts.length !== 3)
    throw Error("A JWT must contain three dot-separated parts.");
  for (const [n, p] of parts.entries()) {
    if (!/^[A-Za-z0-9_-]*$/.test(p) || p.length % 4 === 1)
      throw Error(`Invalid Base64url in token part ${n + 1}.`);
    if (n < 2) {
      const obj = JSON.parse(decodeBase64(p, true));
      if (!obj || typeof obj !== "object" || Array.isArray(obj))
        throw Error("Header and payload must be JSON objects.");
    }
  }
  return {
    token,
    header: decodeProtectedHeader(token),
    payload: decodeJwt(token),
    signature: parts[2],
  };
}
export function claimStatus(
  payload: Record<string, unknown>,
  issuer = "",
  audience = "",
  now = Date.now() / 1000,
) {
  const errors: string[] = [];
  for (const key of ["exp", "iat", "nbf"])
    if (
      payload[key] !== undefined &&
      (typeof payload[key] !== "number" || !Number.isFinite(payload[key]))
    )
      errors.push(`${key} must be a NumericDate.`);
  if (typeof payload.exp === "number" && payload.exp <= now)
    errors.push("Token is expired.");
  if (typeof payload.nbf === "number" && payload.nbf > now)
    errors.push("Token is not yet valid.");
  if (typeof payload.iat === "number" && payload.iat > now)
    errors.push("Issued-at is in the future.");
  if (issuer && payload.iss !== issuer) errors.push("Issuer does not match.");
  if (
    audience &&
    !(Array.isArray(payload.aud)
      ? payload.aud.includes(audience)
      : payload.aud === audience)
  )
    errors.push("Audience does not match.");
  return {
    valid: errors.length === 0,
    errors,
    expectedIssuerChecked: !!issuer,
    expectedAudienceChecked: !!audience,
    dates: Object.fromEntries(
      ["exp", "iat", "nbf"]
        .filter((k) => typeof payload[k] === "number")
        .map((k) => {
          const d = new Date((payload[k] as number) * 1000);
          return [
            k,
            Number.isFinite(d.getTime())
              ? d.toISOString()
              : "Out of date range",
          ];
        }),
    ),
  };
}
export const jwtDecode: Run = (i) => {
  const { header, payload, signature } = decodeToken(i);
  return result({
    signatureVerified: false,
    header,
    payload,
    signature,
    claims: claimStatus(payload),
  });
};
export const jwtVerify: Run = async (i, o) => {
  const { token, header, payload } = decodeToken(i);
  const alg = o.algorithm || "HS256";
  if (header.alg !== alg)
    throw Error(
      "Token algorithm does not match your explicitly selected algorithm.",
    );
  if (
    ![
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "ES256",
      "ES384",
      "EdDSA",
    ].includes(alg)
  )
    throw Error("Unsupported algorithm.");
  required(o.key || "", "Verification key");
  const key = alg.startsWith("HS")
    ? new TextEncoder().encode(o.key)
    : await importSPKI(o.key, alg);
  try {
    await compactVerify(token, key, { algorithms: [alg] });
  } catch {
    throw Error("Signature verification failed. Check the key and token.");
  }
  return result({
    signatureVerified: true,
    claims: claimStatus(payload, o.issuer, o.audience),
    payload,
  });
};
export const hash: Run = async (i, o) => {
  required(i);
  const b = await digest(new TextEncoder().encode(i), o.algorithm);
  return result({
    algorithm: o.algorithm || "SHA-256",
    hex: bytesHex(b),
    base64: bytesB64(b),
  });
};
export const pkce: Run = async () => {
  const verifier = bytesB64(crypto.getRandomValues(new Uint8Array(32)), true);
  return result({
    code_verifier: verifier,
    code_challenge: bytesB64(
      await digest(new TextEncoder().encode(verifier)),
      true,
    ),
    code_challenge_method: "S256",
  });
};
export const jwkPem: Run = async (i, o) => {
  required(i);
  const alg = o.algorithm || "RS256";
  if (o.mode === "PEM to JWK") {
    if (/PRIVATE KEY/.test(i)) throw Error("Private keys are not accepted.");
    return result(
      await exportJWK(await importSPKI(i, alg, { extractable: true })),
    );
  }
  const jwk = JSON.parse(i);
  if (["d", "p", "q", "dp", "dq", "qi", "k"].some((k) => k in jwk))
    throw Error("Private key material is not accepted.");
  if (!["RSA", "EC"].includes(jwk.kty))
    throw Error("Only RSA and EC public keys are supported.");
  const key = await importJWK({ ...jwk, ext: true }, alg, {
    extractable: true,
  });
  if (key instanceof Uint8Array)
    throw Error("Symmetric keys are not accepted.");
  return result(await exportSPKI(key), "text");
};
export const webhook: Run = async (i, o) => {
  required(i);
  if (!o.key?.length) throw Error("Secret is required.");
  required(o.signature || "", "Signature");
  const alg = o.algorithm || "SHA-256";
  if (!["SHA-256", "SHA-384", "SHA-512"].includes(alg))
    throw Error("Unsupported HMAC algorithm.");
  let fresh: null | boolean = null;
  if (o.timestamp) {
    if (!/^\d+$/.test(o.timestamp) || !Number.isFinite(Number(o.timestamp)))
      throw Error("Timestamp must be Unix seconds.");
    const tolerance = Number(o.tolerance || 300);
    if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 86400)
      throw Error("Tolerance must be between 0 and 86400 seconds.");
    fresh = Math.abs(Date.now() / 1000 - Number(o.timestamp)) <= tolerance;
  }
  if (o.signed === "timestamp.body" && !o.timestamp)
    throw Error("Timestamp is required for timestamp.body.");
  if (o.timestamp && o.signed !== "timestamp.body")
    throw Error("Timestamp must be authenticated: select timestamp.body.");
  const sig =
    o.encoding === "Base64"
      ? decodeBytes(o.signature)
      : /^(?:[\da-f]{2})+$/i.test(o.signature)
        ? Uint8Array.from(o.signature.match(/../g)!, (h) => parseInt(h, 16))
        : (() => {
            throw Error("Expected an even-length hexadecimal signature.");
          })();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(o.key),
    { name: "HMAC", hash: alg },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sig as BufferSource,
    new TextEncoder().encode(
      o.signed === "timestamp.body" ? `${o.timestamp}.${i}` : i,
    ),
  );
  return result({
    signatureValid: valid,
    timestampFresh: fresh,
    accepted: valid && fresh !== false,
  });
};
