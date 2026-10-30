# Tool catalog and implementation status

All tools have a dedicated `/tools/<slug>` route. Local inputs stay in memory. The shared workbench provides examples, options, output, copy, clear, download and errors. The registry is the source of truth.

| Utility | Category | Logic | Test coverage | Processing |
| --- | --- | --- | --- | --- |
| [JSON Formatter & Validator](https://toolbox.rigilgilbert.com/tools/json-formatter) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JSON ↔ YAML Converter](https://toolbox.rigilgilbert.com/tools/json-yaml-converter) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Text / JSON Diff Checker](https://toolbox.rigilgilbert.com/tools/diff-checker) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [SQL Formatter](https://toolbox.rigilgilbert.com/tools/sql-formatter) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [XML Formatter & Validator](https://toolbox.rigilgilbert.com/tools/xml-formatter) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JSONPath Tester](https://toolbox.rigilgilbert.com/tools/jsonpath-tester) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JSON ↔ CSV Converter](https://toolbox.rigilgilbert.com/tools/json-csv-converter) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JSON to Java POJO](https://toolbox.rigilgilbert.com/tools/json-to-java) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JSON to TypeScript](https://toolbox.rigilgilbert.com/tools/json-to-typescript) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Regex Tester](https://toolbox.rigilgilbert.com/tools/regex-tester) | JSON & Data | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Base64 Encoder / Decoder](https://toolbox.rigilgilbert.com/tools/base64) | Encoding | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [URL Encoder / Decoder](https://toolbox.rigilgilbert.com/tools/url-encoder) | Encoding | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [HTML Encoder / Decoder](https://toolbox.rigilgilbert.com/tools/html-encoder) | Encoding | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Text Case Converter](https://toolbox.rigilgilbert.com/tools/text-case-converter) | Encoding | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JWT Decoder](https://toolbox.rigilgilbert.com/tools/jwt-decoder) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JWT Signature Verifier](https://toolbox.rigilgilbert.com/tools/jwt-verifier) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Hash Generator](https://toolbox.rigilgilbert.com/tools/hash-generator) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [PKCE Code Generator](https://toolbox.rigilgilbert.com/tools/pkce-generator) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [OAuth 2.0 / OIDC Debugger](https://toolbox.rigilgilbert.com/tools/oauth-debugger) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JWKS Explorer](https://toolbox.rigilgilbert.com/tools/jwks-explorer) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [OIDC Discovery Inspector](https://toolbox.rigilgilbert.com/tools/oidc-discovery) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [SAML Decoder](https://toolbox.rigilgilbert.com/tools/saml-decoder) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [OAuth Scope Analyzer](https://toolbox.rigilgilbert.com/tools/oauth-scope-analyzer) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [SCIM Filter Validator](https://toolbox.rigilgilbert.com/tools/scim-filter-validator) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [JWK ↔ PEM Converter](https://toolbox.rigilgilbert.com/tools/jwk-pem-converter) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Webhook Signature Verifier](https://toolbox.rigilgilbert.com/tools/webhook-signature-verifier) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [AWS IAM Policy Validator](https://toolbox.rigilgilbert.com/tools/aws-iam-policy-validator) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Passkey / WebAuthn Debugger](https://toolbox.rigilgilbert.com/tools/webauthn-debugger) | Security & Authentication | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [HTTP Header Analyzer](https://toolbox.rigilgilbert.com/tools/http-header-analyzer) | API & Network | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [CORS Debugger](https://toolbox.rigilgilbert.com/tools/cors-debugger) | API & Network | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [HTTP Request to cURL](https://toolbox.rigilgilbert.com/tools/http-to-curl) | API & Network | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [IPv4 Subnet Calculator](https://toolbox.rigilgilbert.com/tools/subnet-calculator) | API & Network | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [SSL Certificate Inspector](https://toolbox.rigilgilbert.com/tools/ssl-certificate-inspector) | API & Network | Implemented | Valid / invalid / edge cases; generators have configuration tests | Server hostname diagnostic |
| [Unix Timestamp Converter](https://toolbox.rigilgilbert.com/tools/timestamp-converter) | Date & Time | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Cron Expression Generator](https://toolbox.rigilgilbert.com/tools/cron-generator) | Date & Time | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [UUID Generator & Validator](https://toolbox.rigilgilbert.com/tools/uuid-generator) | Generators | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |
| [Password / Passphrase Generator](https://toolbox.rigilgilbert.com/tools/password-generator) | Generators | Implemented | Valid / invalid / edge cases; generators have configuration tests | Browser |

## Tool instructions and examples

### JSON Formatter & Validator
Route: /tools/json-formatter

Beautify, minify and validate JSON with precise syntax errors.

Controls: Operation (Format, Minify, Validate); Indentation (2, 4, tab).

```text
{"name":"Ada","active":true,"roles":["developer"],"profile":{"city":"London"}}
```

### JSON ↔ YAML Converter
Route: /tools/json-yaml-converter

Convert structured data between JSON and YAML.

Controls: Direction (JSON to YAML, YAML to JSON).

```text
{"name":"Ada","active":true,"roles":["developer"],"profile":{"city":"London"}}
```

### Text / JSON Diff Checker
Route: /tools/diff-checker

Compare text line by line or compare JSON values semantically.

Controls: Comparison (Text, Semantic JSON).

```text
hello
world
```

Second input:
```text
hello
developer
```

### SQL Formatter
Route: /tools/sql-formatter

Format SQL for PostgreSQL, MySQL, SQL Server and Oracle.

Controls: Dialect (sql, postgresql, mysql, transactsql, plsql); Operation (Format, Minify); Indentation (2, 4); Keywords (upper, lower, preserve).

```text
select id,name from users where active=true order by name
```

### XML Formatter & Validator
Route: /tools/xml-formatter

Validate and indent XML without resolving external entities.

```text
<root><user id="1">Ada</user></root>
```

### JSONPath Tester
Route: /tools/jsonpath-tester

Query JSON with safe JSONPath expressions.

Controls: JSONPath expression.

```text
{"name":"Ada","active":true,"roles":["developer"],"profile":{"city":"London"}}
```

Script evaluation is disabled. Property selectors, recursive descent and slices are supported.

### JSON ↔ CSV Converter
Route: /tools/json-csv-converter

Convert table data with custom delimiters and header controls.

Controls: Direction (JSON to CSV, CSV to JSON); Delimiter (,, ;, tab, |); Headers (Yes, No).

```text
[{"name":"Ada","age":36},{"name":"Linus","age":55}]
```

Nested values are serialized as JSON strings. CSV import leaves cell values as strings. Spreadsheet formula prefixes are escaped on export.

### JSON to Java POJO
Route: /tools/json-to-java

Generate nested Java models with lists and optional Lombok.

Controls: Class name; Package; Lombok (No, Yes).

```text
{"name":"Ada","active":true,"roles":["developer"],"profile":{"city":"London"}}
```

### JSON to TypeScript
Route: /tools/json-to-typescript

Infer nested interfaces or types, arrays and optional properties.

Controls: Root name; Declaration (interface, type).

```text
{"name":"Ada","active":true,"roles":["developer"],"profile":{"city":"London"}}
```

### Regex Tester
Route: /tools/regex-tester

Test JavaScript patterns, matches and capturing groups.

Controls: Regular expression; Flags.

```text
Hello world 2026
```

Runs in an isolated worker with a 500 ms deadline. Syntax: . any character; \d digit; + one or more; * zero or more; () capture; ^ start; $ end.

### Base64 Encoder / Decoder
Route: /tools/base64

Encode and decode UTF-8 text, including URL-safe Base64.

Controls: Operation (Encode, Decode); Alphabet (Standard, URL-safe).

```text
Hello, 世界 👋
```

### URL Encoder / Decoder
Route: /tools/url-encoder

Encode URL components, decode text or inspect query parameters.

Controls: Operation (Encode, Decode, Parse query).

```text
hello world & tea
```

Component encoding escapes reserved delimiters. Full URL encoding (encodeURI) preserves URL structure. Query parsing treats + as space.

### HTML Encoder / Decoder
Route: /tools/html-encoder

Escape and decode HTML entities safely as plain text.

Controls: Operation (Encode, Decode).

```text
<strong>Hello & goodbye</strong>
```

### Text Case Converter
Route: /tools/text-case-converter

Convert words into eight useful naming conventions.

Controls: Case (UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE).

```text
hello developer toolbox
```

### JWT Decoder
Route: /tools/jwt-decoder

Inspect token headers, claims and expiration without sending a token.

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpc3MiOiJleGFtcGxlIiwiZXhwIjoxODkzNDU2MDAwfQ.c2lnbmF0dXJl
```

Decoding does not verify authenticity. Never trust claims until signature and required claims have been validated.

### JWT Signature Verifier
Route: /tools/jwt-verifier

Verify an explicitly selected algorithm and evaluate claims separately.

Controls: Expected algorithm (HS256, HS384, HS512, RS256, RS384, RS512, PS256, ES256, ES384, EdDSA); HMAC secret or public PEM key; Expected issuer; Expected audience.

Generate a fresh value or supply the key/token required by the labeled controls. Private-key conversion is not supported.

Choose the algorithm independently of the header. Keys stay local. A valid signature does not imply valid issuer, audience or lifetime.

### Hash Generator
Route: /tools/hash-generator

Hash text or files with SHA-256, SHA-384 and SHA-512.

Controls: Algorithm (SHA-256, SHA-384, SHA-512).

```text
abc
```

Fast hashes are unsuitable for password storage. File limit: 20 MB.

### PKCE Code Generator
Route: /tools/pkce-generator

Generate a cryptographically random verifier and S256 challenge.

Generate a fresh value or supply the key/token required by the labeled controls. Private-key conversion is not supported.

OAuth PKCE uses a 43–128 character verifier and a Base64url SHA-256 challenge. Generate a new verifier for each authorization request.

### OAuth 2.0 / OIDC Debugger
Route: /tools/oauth-debugger

Inspect authorization URLs and callback parameters locally.

```text
https://identity.example/authorize?response_type=code&client_id=example&redirect_uri=https%3A%2F%2Fapp.example%2Fcallback&scope=openid%20profile&state=example&code_challenge=example&code_challenge_method=S256
```

Authorization code exchanges happen at a token endpoint; PKCE binds the code to its client. Client credentials are for confidential machine clients. Example: POST /token with grant_type=client_credentials (use placeholders, never embed a real secret).

### JWKS Explorer
Route: /tools/jwks-explorer

Inspect public JSON Web Key Sets and key metadata.

```text
{"keys":[{"kty":"RSA","kid":"example","alg":"RS256","use":"sig","n":"AQAB","e":"AQAB"}]}
```

Optional HTTPS retrieval is direct from your browser and requires CORS. Only public keys should be used.

### OIDC Discovery Inspector
Route: /tools/oidc-discovery

Explore issuer, endpoints, scopes and supported OIDC algorithms.

```text
{"issuer":"https://identity.example","authorization_endpoint":"https://identity.example/authorize","token_endpoint":"https://identity.example/token","jwks_uri":"https://identity.example/keys","response_types_supported":["code"],"subject_types_supported":["public"],"id_token_signing_alg_values_supported":["RS256"],"scopes_supported":["openid","profile"]}
```

Paste metadata or optionally retrieve an HTTPS discovery document in your browser. Issuer identifies the authority; jwks_uri publishes verification keys. Remote servers see your IP and must allow CORS.

### SAML Decoder
Route: /tools/saml-decoder

Decode XML, Base64 POST and deflated Redirect binding messages.

```text
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"><saml:Issuer>https://identity.example</saml:Issuer><saml:Subject><saml:NameID>ada@example.com</saml:NameID></saml:Subject></saml:Assertion>
```

Decoding does not validate XML signatures or establish trust. XML external entities are rejected.

### OAuth Scope Analyzer
Route: /tools/oauth-scope-analyzer

Compare requested scopes with granted scopes or token claims.

Controls: Delimiter (space, ,, ;).

```text
openid profile email
```

Second input:
```text
openid profile
```

### SCIM Filter Validator
Route: /tools/scim-filter-validator

Validate SCIM 2.0 comparison, logic and value-path filters.

```text
userName eq "ada" and emails[type eq "work" and value co "@example.com"]
```

RFC 7644 operators: eq ne co sw ew pr gt ge lt le; logical and, or, not. Attribute names are case insensitive.

### JWK ↔ PEM Converter
Route: /tools/jwk-pem-converter

Convert RSA and EC public keys locally between JWK and SPKI PEM.

Controls: Direction (JWK to PEM, PEM to JWK); Key algorithm (RS256, ES256, ES384, ES512).

Generate a fresh value or supply the key/token required by the labeled controls. Private-key conversion is not supported.

Public keys only. Private-key fields and PRIVATE KEY PEM blocks are rejected. Select the algorithm matching the key curve.

### Webhook Signature Verifier
Route: /tools/webhook-signature-verifier

Verify HMAC signatures over the exact request body.

Controls: Secret; Expected signature; Algorithm (SHA-256, SHA-384, SHA-512); Signature encoding (hex, Base64); Optional Unix timestamp; Timestamp tolerance (seconds); Signed message (Body only, timestamp.body).

```text
hello
```

Use the exact raw body. Timestamp checking is meaningful only when the timestamp is included in the signed message.

### AWS IAM Policy Validator
Route: /tools/aws-iam-policy-validator

Check policy structure and flag overly broad permissions.

```text
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:GetObject","Resource":"arn:aws:s3:::example/*"}]}
```

Local structural checks cannot evaluate effective permissions and are not equivalent to AWS IAM Access Analyzer.

### Passkey / WebAuthn Debugger
Route: /tools/webauthn-debugger

Inspect clientDataJSON and authenticator data without storing credentials.

Controls: Structure (Client data JSON, Authenticator data, Attestation object); Expected RP ID (optional).

```text
{"type":"webauthn.get","challenge":"ZXhhbXBsZQ","origin":"https://example.com","crossOrigin":false}
```

Client data accepts JSON or Base64url. Authenticator data accepts Base64url bytes. Inspection does not verify an assertion signature.

### HTTP Header Analyzer
Route: /tools/http-header-analyzer

Inspect security headers, CORS and caching directives.

```text
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
```

### CORS Debugger
Route: /tools/cors-debugger

Simulate origin, method and header compatibility.

Controls: Request origin; Request method; Request header names; Credentials (No, Yes).

```text
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: content-type
```

Simulation only. Browsers enforce CORS; this tool cannot bypass it. Non-simple requests require an OPTIONS preflight.

### HTTP Request to cURL
Route: /tools/http-to-curl

Turn a raw HTTP request into a safely quoted POSIX shell command.

```text
POST https://api.example.com/users?active=true HTTP/1.1
Content-Type: application/json

{"name":"Ada"}
```

Paste method, absolute URL, headers and optional body. For forms use application/x-www-form-urlencoded. Query parameters are preserved. Review sensitive Authorization headers before sharing.

### IPv4 Subnet Calculator
Route: /tools/subnet-calculator

Calculate network, broadcast, masks and usable address ranges.

```text
192.168.1.42/24
```

### SSL Certificate Inspector
Route: /tools/ssl-certificate-inspector

Inspect an HTTPS server certificate and its presented chain.

```text
example.com
```

Server diagnostic: only the public hostname is sent to our server. HTTPS port 443 only; public DNS addresses only. No redirects or custom ports. TLS metadata inspection does not replace a full trust audit.

### Unix Timestamp Converter
Route: /tools/timestamp-converter

Convert Unix seconds, milliseconds and ISO dates across timezones.

Controls: Numeric unit (seconds, milliseconds); Display timezone (UTC, America/Chicago, America/New_York, Europe/London, Europe/Paris, Asia/Tokyo, Asia/Kolkata, Australia/Sydney).

```text
1700000000
```

### Cron Expression Generator
Route: /tools/cron-generator

Build and explain standard five-field cron with upcoming runs.

Controls: Timezone (UTC, America/Chicago, America/New_York, Europe/London, Asia/Tokyo); Minute; Hour; Day of month; Month; Day of week.

```text
*/15 * * * *
```

Standard five-field cron: minute hour day month weekday. Day fields use OR semantics. Next runs use the selected timezone and its DST rules.

### UUID Generator & Validator
Route: /tools/uuid-generator

Generate UUID v4/v7 in bulk or inspect an existing identifier.

Controls: Operation (Generate, Validate); Version (v4, v7); Count (1–1000).

Generate a fresh value or supply the key/token required by the labeled controls. Private-key conversion is not supported.

### Password / Passphrase Generator
Route: /tools/password-generator

Generate secure random passwords and memorable passphrases.

Controls: Mode (Password, Passphrase); Password length / word count; Uppercase (Yes, No); Lowercase (Yes, No); Digits (Yes, No); Symbols (Yes, No); Exclude ambiguous characters (Yes, No).

Generate a fresh value or supply the key/token required by the labeled controls. Private-key conversion is not supported.

Generated using browser cryptographic randomness. Entropy estimates describe the generator, not resistance to phishing or reuse. Nothing is transmitted or saved.

