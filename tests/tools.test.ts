// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { tools } from "../src/config/tools";
import { getRunner } from "../src/lib/tools/runner";
import { SignJWT, generateKeyPair, exportSPKI, exportJWK } from "jose";
import { encodeBase64, decodeBase64 } from "../src/lib/tools/encoding";
import { bytesB64 } from "../src/lib/tools/crypto";
import { deflateSync } from "fflate";
import { Encoder } from "cbor-x";
const defaults = (slug: string) =>
  Object.fromEntries(
    (tools.find((t) => t.slug === slug)!.fields || []).map((f) => [
      f.key,
      f.default || "",
    ]),
  );
async function run(
  slug: string,
  input: string,
  options: Record<string, string> = {},
  secondary = "",
) {
  return (await getRunner(slug))(
    input,
    { ...defaults(slug), ...options },
    secondary,
  );
}
describe("registry", () => {
  it("contains precisely 37 unique utilities in six categories", () => {
    expect(tools).toHaveLength(37);
    expect(new Set(tools.map((t) => t.slug)).size).toBe(37);
    expect(new Set(tools.map((t) => t.category)).size).toBe(6);
  });
});
const simple = tools.filter(
  (t) =>
    t.example &&
    ![
      "ssl-certificate-inspector",
      "regex-tester",
      "webhook-signature-verifier",
    ].includes(t.slug),
);
describe.each(simple)("$name", (tool) => {
  it("processes its valid example", async () => {
    expect(
      (await run(tool.slug, tool.example, {}, tool.secondary)).text.length,
    ).toBeGreaterThan(0);
  });
  it("rejects missing input", async () => {
    await expect(run(tool.slug, "")).rejects.toThrow();
  });
});
describe("encoding edge cases and round trips", () => {
  it.each(["hello", "世界 👋", "\uFEFFhello", "", String.fromCharCode(0)])(
    "preserves %j",
    (s) => {
      expect(decodeBase64(encodeBase64(s))).toBe(s);
      expect(decodeBase64(encodeBase64(s, true), true)).toBe(s);
    },
  );
  it.each(["A", "Zg=", "Zg===", "Zh==", "!", "/w=="])(
    "rejects malformed/non-text %s",
    (s) => expect(() => decodeBase64(s)).toThrow(),
  );
  it("handles duplicate query parameters", async () =>
    expect(
      (await run("url-encoder", "x=1&x=2", { mode: "Parse query" })).text,
    ).toContain("2"));
  it("does not execute HTML", async () =>
    expect(
      (
        await run("html-encoder", "&lt;script&gt;alert(1)&lt;/script&gt;", {
          mode: "Decode",
        })
      ).text,
    ).toBe("<script>alert(1)</script>"));
  it("splits camelCase words", async () =>
    expect(
      (await run("text-case-converter", "helloWorld", { mode: "snake_case" }))
        .text,
    ).toBe("hello_world"));
});
describe("data edge cases", () => {
  it("rejects TypeScript reserved names", async () =>
    await expect(
      run("json-to-typescript", "{}", { name: "class" }),
    ).rejects.toThrow(/type name/));
  it("rejects non-finite YAML values", async () =>
    await expect(
      run("json-yaml-converter", "x: .nan", { mode: "YAML to JSON" }),
    ).rejects.toThrow(/non-finite/));
  it("reports JSON line errors", async () =>
    await expect(run("json-formatter", '{\n"a":}')).rejects.toThrow(/line 2/));
  it("round trips YAML", async () => {
    const yaml = await run("json-yaml-converter", '{"a":[1,true,null]}');
    expect(
      JSON.parse(
        (await run("json-yaml-converter", yaml.text, { mode: "YAML to JSON" }))
          .text,
      ),
    ).toEqual({ a: [1, true, null] });
  });
  it("rejects duplicate YAML keys", async () =>
    await expect(
      run("json-yaml-converter", "a: 1\na: 2", { mode: "YAML to JSON" }),
    ).rejects.toThrow());
  it("ignores JSON property ordering", async () =>
    expect(
      (
        await run(
          "diff-checker",
          '{"a":1,"b":2}',
          { mode: "Semantic JSON" },
          '{"b":2,"a":1}',
        )
      ).text,
    ).toBe("Inputs are equal."));
  it("keeps SQL string whitespace when minifying", async () =>
    expect(
      (
        await run("sql-formatter", "select 'a  b' from users", {
          mode: "Minify",
        })
      ).text,
    ).toContain("'a  b'"));
  it("rejects external entity XML", async () =>
    await expect(
      run(
        "xml-formatter",
        '<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><x>&e;</x>',
      ),
    ).rejects.toThrow(/disabled/));
  it("rejects malformed XML", async () =>
    await expect(run("xml-formatter", "<x><y></x>")).rejects.toThrow());
  it("returns empty JSONPath matches", async () =>
    expect(
      (await run("jsonpath-tester", "{}", { path: "$.missing" })).text,
    ).toBe("[]"));
  it("blocks JSONPath script execution", async () =>
    await expect(
      run("jsonpath-tester", "[1,2]", {
        path: "$[?((function(){return true})())]",
      }),
    ).rejects.toThrow());
  it("quotes CSV cells and serializes nesting", async () => {
    const csv = await run(
      "json-csv-converter",
      '[{"a":"a,b","nested":{"x":1}}]',
    );
    const back = await run("json-csv-converter", csv.text, {
      mode: "CSV to JSON",
    });
    expect(JSON.parse(back.text)[0]).toEqual({ a: "a,b", nested: '{"x":1}' });
  });
  it("escapes spreadsheet formulas", async () =>
    expect(
      (await run("json-csv-converter", '[{"a":"=CMD()"}]')).text,
    ).toContain("'=CMD()"));
  it("infers optional and union TS properties", async () => {
    const out = await run(
      "json-to-typescript",
      '[{"a":1},{"a":null,"b":true}]',
    );
    expect(out.text).toContain('"b"?');
    expect(out.text).toContain("number | null");
  });
  it("handles nullable lists in Java", async () => {
    const out = await run("json-to-java", '{"a":[1,null],"b":null}');
    expect(out.text).toContain("java.util.List<Long>");
    expect(out.text).toContain("Object b");
  });
  it("rejects Java reserved field names", async () =>
    await expect(run("json-to-java", '{"class":1}')).rejects.toThrow(
      /valid Java/,
    ));
});
describe("security operations", () => {
  it("hashes abc with the SHA-256 standard vector", async () =>
    expect((await run("hash-generator", "abc")).text).toContain(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    ));
  it("SHA-384 and SHA-512 vectors", async () => {
    expect(
      (await run("hash-generator", "abc", { algorithm: "SHA-384" })).text,
    ).toContain("cb00753f45a35e8b");
    expect(
      (await run("hash-generator", "abc", { algorithm: "SHA-512" })).text,
    ).toContain("ddaf35a193617aba");
  });
  it("generates valid PKCE with matching challenge", async () => {
    const p = JSON.parse((await run("pkce-generator", "")).text);
    expect(p.code_verifier).toMatch(/^[\w-]{43}$/);
    const expected = bytesB64(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(p.code_verifier),
        ),
      ),
      true,
    );
    expect(p.code_challenge).toBe(expected);
  });
  it("verifies RFC 7636 PKCE vector", async () => {
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
    );
    expect(bytesB64(new Uint8Array(hash), true)).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
  it("validates HMAC JWT signatures separately from claims", async () => {
    const key = new TextEncoder().encode("a".repeat(32));
    const token = await new SignJWT({ iss: "issuer", aud: "aud" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(key);
    const value = JSON.parse(
      (
        await run("jwt-verifier", token, {
          key: "a".repeat(32),
          issuer: "wrong",
        })
      ).text,
    );
    expect(value.signatureVerified).toBe(true);
    expect(value.claims.valid).toBe(false);
    await expect(
      run("jwt-verifier", token, { key: "b".repeat(32) }),
    ).rejects.toThrow(/Signature/);
    await expect(
      run("jwt-verifier", token, { key: "a".repeat(32), algorithm: "RS256" }),
    ).rejects.toThrow(/algorithm/);
  });
  it("verifies an RSA JWT and rejects tampering", async () => {
    const pair = await generateKeyPair("RS256");
    const token = await new SignJWT({ sub: "test" })
      .setProtectedHeader({ alg: "RS256" })
      .sign(pair.privateKey);
    const pem = await exportSPKI(pair.publicKey);
    expect(
      (await run("jwt-verifier", token, { key: pem, algorithm: "RS256" })).text,
    ).toContain('"signatureVerified": true');
    await expect(
      run(
        "jwt-verifier",
        token.replace(
          token.split(".")[1],
          encodeBase64('{"sub":"attacker"}', true),
        ),
        { key: pem, algorithm: "RS256" },
      ),
    ).rejects.toThrow();
  });
  it("flags expired JWT claims", async () => {
    const token = await new SignJWT({ exp: 1, nbf: 2 })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode("x".repeat(32)));
    expect((await run("jwt-decoder", token)).text).toContain("expired");
  });
  it("rejects encrypted JWTs", async () =>
    await expect(run("jwt-decoder", "a.b.c.d.e")).rejects.toThrow(/JWE/));
  it("round trips RSA and EC public JWK/PEM", async () => {
    for (const alg of ["RS256", "ES256"]) {
      const pair = await generateKeyPair(alg, { extractable: true });
      const jwk = await exportJWK(pair.publicKey);
      const pem = await run("jwk-pem-converter", JSON.stringify(jwk), {
        algorithm: alg,
      });
      const back = JSON.parse(
        (
          await run("jwk-pem-converter", pem.text, {
            mode: "PEM to JWK",
            algorithm: alg,
          })
        ).text,
      );
      expect(back.kty).toBe(jwk.kty);
      expect(back.n || back.x).toBe(jwk.n || jwk.x);
    }
  });
  it("rejects private JWK/PEM and empty input", async () => {
    await expect(
      run("jwk-pem-converter", '{"kty":"RSA","d":"secret"}'),
    ).rejects.toThrow(/Private/);
    await expect(
      run("jwk-pem-converter", "-----BEGIN PRIVATE KEY-----", {
        mode: "PEM to JWK",
      }),
    ).rejects.toThrow(/Private/);
    await expect(run("jwk-pem-converter", "")).rejects.toThrow();
  });
  it("verifies RFC 4231 HMAC vector", async () => {
    const signature =
      "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7";
    expect(
      JSON.parse(
        (
          await run("webhook-signature-verifier", "Hi There", {
            key: "\x0b".repeat(20),
            signature,
          })
        ).text,
      ).accepted,
    ).toBe(true);
    expect(
      JSON.parse(
        (
          await run("webhook-signature-verifier", "Tampered", {
            key: "\x0b".repeat(20),
            signature,
          })
        ).text,
      ).accepted,
    ).toBe(false);
    await expect(
      run("webhook-signature-verifier", "hello", {
        key: "x",
        signature: "abc",
      }),
    ).rejects.toThrow();
  });
  it("rejects unsigned timestamp checks", async () =>
    await expect(
      run("webhook-signature-verifier", "x", {
        key: "x",
        signature: "aa",
        timestamp: "1",
      }),
    ).rejects.toThrow(/authenticated/));
  it("rejects private JWKS material", async () =>
    await expect(
      run("jwks-explorer", '{"keys":[{"kty":"oct","k":"secret"}]}'),
    ).rejects.toThrow(/Private/));
  it("flags unsafe OAuth flows", async () =>
    expect(
      (
        await run(
          "oauth-debugger",
          "http://example.com/?response_type=token&client_secret=x",
        )
      ).text,
    ).toContain("must never"));
  it("flags non-HTTPS discovery endpoints", async () => {
    const example = tools
      .find((t) => t.slug === "oidc-discovery")!
      .example.replaceAll("https:", "http:");
    expect((await run("oidc-discovery", example)).text).toContain(
      "must use HTTPS",
    );
  });
  it("decodes POST and Redirect SAML bindings", async () => {
    const xml = "<Assertion><Issuer>test</Issuer></Assertion>";
    expect((await run("saml-decoder", encodeBase64(xml))).text).toContain(
      "<Issuer>",
    );
    const compressed = bytesB64(deflateSync(new TextEncoder().encode(xml)));
    expect(
      (
        await run(
          "saml-decoder",
          "https://id.example/?SAMLRequest=" + encodeURIComponent(compressed),
        )
      ).text,
    ).toContain("test");
  });
  it("rejects SAML entity declarations", async () =>
    await expect(
      run("saml-decoder", encodeBase64("<!DOCTYPE a><a/>")),
    ).rejects.toThrow(/disabled/));
  it("compares scope sets with custom delimiters", async () =>
    expect(
      JSON.parse(
        (await run("oauth-scope-analyzer", "a,b,a", { delimiter: "," }, "b,c"))
          .text,
      ).missing,
    ).toEqual(["a"]));
  it.each([
    "userName eq",
    "not userName pr",
    'x eq "a" garbage',
    'x eq "a" and',
    'emails[type eq "work"',
  ])(
    "rejects invalid SCIM %s",
    async (i) =>
      await expect(run("scim-filter-validator", i)).rejects.toThrow(),
  );
  it("handles nested SCIM precedence and numbers", async () =>
    expect(
      (
        await run(
          "scim-filter-validator",
          "not (active eq false) and (age ge 18 or userName pr)",
        )
      ).text,
    ).toContain('"valid": true'));
  it("flags IAM wildcards and rejects invalid effects", async () => {
    expect(
      (
        await run(
          "aws-iam-policy-validator",
          '{"Statement":{"Effect":"Allow","Action":"*","Resource":"*"}}',
        )
      ).text,
    ).toContain("wildcard");
    await expect(
      run("aws-iam-policy-validator", '{"Statement":{"Effect":"Maybe"}}'),
    ).rejects.toThrow(/Effect/);
  });
  it("decodes WebAuthn flags, counter and RP ID hash", async () => {
    const b = new Uint8Array(37);
    b.set(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode("example.com"),
        ),
      ),
    );
    b[32] = 5;
    b[36] = 9;
    const value = JSON.parse(
      (
        await run("webauthn-debugger", bytesB64(b, true), {
          mode: "Authenticator data",
          rpId: "example.com",
        })
      ).text,
    );
    expect(value.flags.userVerified).toBe(true);
    expect(value.signCount).toBe(9);
    expect(value.rpIdHashMatches).toBe(true);
    await expect(
      run("webauthn-debugger", "AA", { mode: "Authenticator data" }),
    ).rejects.toThrow(/37/);
  });
});
describe("network and date edge cases", () => {
  it("rejects calendar rollover dates", async () =>
    await expect(
      run("timestamp-converter", "2026-02-31T00:00:00Z"),
    ).rejects.toThrow(/calendar/));
  it("handles prototype-named query parameters as ordinary data", async () =>
    expect(
      JSON.parse(
        (
          await run("url-encoder", "__proto__=safe&constructor=value", {
            mode: "Parse query",
          })
        ).text,
      ),
    ).toEqual({ ["__proto__"]: ["safe"], constructor: ["value"] }));
  it("decodes an attestation CBOR object", async () => {
    const b = new Uint8Array(37);
    b[32] = 1;
    const encoded = new Encoder({
      mapsAsObjects: false,
      useRecords: false,
    }).encode(
      new Map<string, unknown>([
        ["fmt", "none"],
        ["authData", b],
        ["attStmt", new Map()],
      ]),
    );
    const out = JSON.parse(
      (
        await run("webauthn-debugger", bytesB64(encoded, true), {
          mode: "Attestation object",
        })
      ).text,
    );
    expect(out.format).toBe("none");
    expect(out.authenticatorData.flags.userPresent).toBe(true);
  });
  it("flags credentialed wildcard CORS", async () => {
    const i =
      "Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true";
    expect((await run("http-header-analyzer", i)).text).toContain("Wildcard");
    expect(
      JSON.parse((await run("cors-debugger", i, { credentials: "Yes" })).text)
        .compatible,
    ).toBe(false);
  });
  it("rejects malformed headers", async () =>
    await expect(run("http-header-analyzer", "bad")).rejects.toThrow());
  it("quotes shell injection safely", async () => {
    const value = (
      await run(
        "http-to-curl",
        "POST https://example.com/\nX-Name: it's $(id)\n\nhi ' there",
      )
    ).text;
    expect(value).toContain("'\"'\"'");
    expect(value).toContain("$(id)");
  });
  it.each([
    ["0.0.0.0/0", 4294967294],
    ["192.0.2.0/31", 2],
    ["192.0.2.1/32", 1],
  ])("handles subnet %s", async (i, n) =>
    expect(
      JSON.parse((await run("subnet-calculator", String(i))).text).usableHosts,
    ).toBe(n),
  );
  it("rejects invalid CIDR", async () =>
    await expect(run("subnet-calculator", "999.0.0.1/33")).rejects.toThrow());
  it("handles epoch and negative timestamps", async () => {
    expect((await run("timestamp-converter", "0")).text).toContain(
      "1970-01-01T00:00:00.000Z",
    );
    expect((await run("timestamp-converter", "-1")).text).toContain(
      "1969-12-31",
    );
    await expect(run("timestamp-converter", "yesterday")).rejects.toThrow();
  });
  it("rejects six-field cron and handles DST timezone", async () => {
    await expect(run("cron-generator", "* * * * * *")).rejects.toThrow(/five/);
    expect(
      JSON.parse(
        (
          await run("cron-generator", "30 2 * * *", {
            timezone: "America/Chicago",
          })
        ).text,
      ).nextRuns,
    ).toHaveLength(10);
  });
});
describe("generators and regex", () => {
  it.each(["v4", "v7"])("generates %s and validates it", async (version) => {
    const value = (
      await run("uuid-generator", "", { version, count: "2" })
    ).text.split("\n");
    expect(value).toHaveLength(2);
    expect(
      (await run("uuid-generator", value[0], { mode: "Validate" })).text,
    ).toContain('"valid": true');
  });
  it("rejects invalid UUID and bulk sizes", async () => {
    await expect(
      run("uuid-generator", "x", { mode: "Validate" }),
    ).rejects.toThrow();
    await expect(
      run("uuid-generator", "", { count: "1001" }),
    ).rejects.toThrow();
  });
  it("generates passwords with every enabled alphabet", async () => {
    const p = JSON.parse((await run("password-generator", "")).text).password;
    expect(p).toHaveLength(20);
    expect(p).toMatch(/[A-Z]/);
    expect(p).toMatch(/[a-z]/);
    expect(p).toMatch(/\d/);
    expect(p).toMatch(/[^\w]/);
    expect(p).not.toMatch(/[Il1O0o]/);
  });
  it("generates passphrases and rejects invalid settings", async () => {
    const p = JSON.parse(
      (await run("password-generator", "", { mode: "Passphrase", length: "6" }))
        .text,
    );
    expect(p.passphrase.split("-")).toHaveLength(6);
    await expect(
      run("password-generator", "", { length: "0" }),
    ).rejects.toThrow();
    await expect(
      run("password-generator", "", {
        uppercase: "No",
        lowercase: "No",
        digits: "No",
        symbols: "No",
      }),
    ).rejects.toThrow();
  });
  it("captures regex groups and limits empty matches", async () => {
    const m = JSON.parse(
      (await run("regex-tester", "abc 123", { pattern: "(\\d+)", flags: "g" }))
        .text,
    );
    expect(m.matches[0].groups).toEqual(["123"]);
    expect(
      JSON.parse(
        (await run("regex-tester", "abc", { pattern: "(?:)", flags: "g" }))
          .text,
      ).count,
    ).toBe(4);
  });
  it("rejects invalid regex and flags", async () => {
    await expect(run("regex-tester", "x", { pattern: "[" })).rejects.toThrow();
    await expect(
      run("regex-tester", "x", { pattern: "x", flags: "gg" }),
    ).rejects.toThrow();
  });
  it("does not transmit local-tool values", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await run("base64", "secret-sentinel");
    await run("hash-generator", "secret-sentinel");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
