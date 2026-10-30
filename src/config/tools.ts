import type { ToolDefinition, Field } from "@/lib/tools/types";
export const categories = [
  {
    id: "data",
    name: "JSON & Data",
    icon: "Braces",
    color: "#8b9aff",
    description: "Bring structure to your data.",
  },
  {
    id: "encoding",
    name: "Encoding",
    icon: "Binary",
    color: "#dba2f7",
    description: "Translate between formats, effortlessly.",
  },
  {
    id: "security",
    name: "Security & Authentication",
    icon: "ShieldCheck",
    color: "#74d4b0",
    description: "Inspect identity. Understand your security.",
  },
  {
    id: "network",
    name: "API & Network",
    icon: "Network",
    color: "#efb874",
    description: "Make every request count.",
  },
  {
    id: "time",
    name: "Date & Time",
    icon: "Clock3",
    color: "#7bc9ed",
    description: "A little clarity around time.",
  },
  {
    id: "generators",
    name: "Generators",
    icon: "Sparkles",
    color: "#eda4b7",
    description: "Good things, freshly generated.",
  },
];
const select = (
  key: string,
  label: string,
  choices: string[],
  value?: string,
): Field => ({ key, label, choices, default: value || choices[0] });
const text = (
  key: string,
  label: string,
  value = "",
  type?: Field["type"],
): Field => ({ key, label, default: value, type });
const json =
  '{"name":"Ada","active":true,"roles":["developer"],"profile":{"city":"London"}}';
const define = (
  slug: string,
  name: string,
  category: string,
  description: string,
  example: string,
  extra: Partial<ToolDefinition> = {},
): ToolDefinition => ({
  slug,
  name,
  category,
  description,
  example,
  keywords: [slug.replaceAll("-", " "), description],
  icon: categories.find((c) => c.id === category)!.icon,
  ...extra,
});
export const tools: ToolDefinition[] = [
  define(
    "json-formatter",
    "JSON Formatter & Validator",
    "data",
    "Beautify, minify and validate JSON with precise syntax errors.",
    json,
    {
      language: "json",
      fields: [
        select("mode", "Operation", ["Format", "Minify", "Validate"]),
        select("indent", "Indentation", ["2", "4", "tab"]),
      ],
    },
  ),
  define(
    "json-yaml-converter",
    "JSON ↔ YAML Converter",
    "data",
    "Convert structured data between JSON and YAML.",
    json,
    { fields: [select("mode", "Direction", ["JSON to YAML", "YAML to JSON"])] },
  ),
  define(
    "diff-checker",
    "Text / JSON Diff Checker",
    "data",
    "Compare text line by line or compare JSON values semantically.",
    "hello\nworld",
    {
      secondary: "hello\ndeveloper",
      fields: [select("mode", "Comparison", ["Text", "Semantic JSON"])],
    },
  ),
  define(
    "sql-formatter",
    "SQL Formatter",
    "data",
    "Format SQL for PostgreSQL, MySQL, SQL Server and Oracle.",
    "select id,name from users where active=true order by name",
    {
      fields: [
        select("dialect", "Dialect", [
          "sql",
          "postgresql",
          "mysql",
          "transactsql",
          "plsql",
        ]),
        select("mode", "Operation", ["Format", "Minify"]),
        select("indent", "Indentation", ["2", "4"]),
        select("case", "Keywords", ["upper", "lower", "preserve"]),
      ],
      language: "sql",
    },
  ),
  define(
    "xml-formatter",
    "XML Formatter & Validator",
    "data",
    "Validate and indent XML without resolving external entities.",
    '<root><user id="1">Ada</user></root>',
    { language: "xml" },
  ),
  define(
    "jsonpath-tester",
    "JSONPath Tester",
    "data",
    "Query JSON with safe JSONPath expressions.",
    json,
    {
      fields: [text("path", "JSONPath expression", "$.roles[*]")],
      note: "Script evaluation is disabled. Property selectors, recursive descent and slices are supported.",
    },
  ),
  define(
    "json-csv-converter",
    "JSON ↔ CSV Converter",
    "data",
    "Convert table data with custom delimiters and header controls.",
    '[{"name":"Ada","age":36},{"name":"Linus","age":55}]',
    {
      fields: [
        select("mode", "Direction", ["JSON to CSV", "CSV to JSON"]),
        select("delimiter", "Delimiter", [",", ";", "tab", "|"]),
        select("headers", "Headers", ["Yes", "No"]),
      ],
      note: "Nested values are serialized as JSON strings. CSV import leaves cell values as strings. Spreadsheet formula prefixes are escaped on export.",
    },
  ),
  define(
    "json-to-java",
    "JSON to Java POJO",
    "data",
    "Generate nested Java models with lists and optional Lombok.",
    json,
    {
      fields: [
        text("name", "Class name", "Root"),
        text("package", "Package", "com.example.model"),
        select("lombok", "Lombok", ["No", "Yes"]),
      ],
      language: "java",
    },
  ),
  define(
    "json-to-typescript",
    "JSON to TypeScript",
    "data",
    "Infer nested interfaces or types, arrays and optional properties.",
    json,
    {
      fields: [
        text("name", "Root name", "Root"),
        select("mode", "Declaration", ["interface", "type"]),
      ],
      language: "typescript",
    },
  ),
  define(
    "regex-tester",
    "Regex Tester",
    "data",
    "Test JavaScript patterns, matches and capturing groups.",
    "Hello world 2026",
    {
      fields: [
        text("pattern", "Regular expression", "(\\w+)"),
        text("flags", "Flags", "g"),
      ],
      note: "Runs in an isolated worker with a 500 ms deadline. Syntax: . any character; \\d digit; + one or more; * zero or more; () capture; ^ start; $ end.",
    },
  ),
  define(
    "base64",
    "Base64 Encoder / Decoder",
    "encoding",
    "Encode and decode UTF-8 text, including URL-safe Base64.",
    "Hello, 世界 👋",
    {
      fields: [
        select("mode", "Operation", ["Encode", "Decode"]),
        select("urlSafe", "Alphabet", ["Standard", "URL-safe"]),
      ],
    },
  ),
  define(
    "url-encoder",
    "URL Encoder / Decoder",
    "encoding",
    "Encode URL components, decode text or inspect query parameters.",
    "hello world & tea",
    {
      fields: [
        select("mode", "Operation", ["Encode", "Decode", "Parse query"]),
      ],
      note: "Component encoding escapes reserved delimiters. Full URL encoding (encodeURI) preserves URL structure. Query parsing treats + as space.",
    },
  ),
  define(
    "html-encoder",
    "HTML Encoder / Decoder",
    "encoding",
    "Escape and decode HTML entities safely as plain text.",
    "<strong>Hello & goodbye</strong>",
    { fields: [select("mode", "Operation", ["Encode", "Decode"])] },
  ),
  define(
    "text-case-converter",
    "Text Case Converter",
    "encoding",
    "Convert words into eight useful naming conventions.",
    "hello developer toolbox",
    {
      fields: [
        select("mode", "Case", [
          "UPPERCASE",
          "lowercase",
          "Title Case",
          "camelCase",
          "PascalCase",
          "snake_case",
          "kebab-case",
          "CONSTANT_CASE",
        ]),
      ],
    },
  ),
  define(
    "jwt-decoder",
    "JWT Decoder",
    "security",
    "Inspect token headers, claims and expiration without sending a token.",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpc3MiOiJleGFtcGxlIiwiZXhwIjoxODkzNDU2MDAwfQ.c2lnbmF0dXJl",
    {
      note: "Decoding does not verify authenticity. Never trust claims until signature and required claims have been validated.",
    },
  ),
  define(
    "jwt-verifier",
    "JWT Signature Verifier",
    "security",
    "Verify an explicitly selected algorithm and evaluate claims separately.",
    "",
    {
      fields: [
        select("algorithm", "Expected algorithm", [
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
        ]),
        text("key", "HMAC secret or public PEM key", "", "textarea"),
        text("issuer", "Expected issuer"),
        text("audience", "Expected audience"),
      ],
      note: "Choose the algorithm independently of the header. Keys stay local. A valid signature does not imply valid issuer, audience or lifetime.",
    },
  ),
  define(
    "hash-generator",
    "Hash Generator",
    "security",
    "Hash text or files with SHA-256, SHA-384 and SHA-512.",
    "abc",
    {
      fields: [
        select("algorithm", "Algorithm", ["SHA-256", "SHA-384", "SHA-512"]),
      ],
      note: "Fast hashes are unsuitable for password storage. File limit: 20 MB.",
    },
  ),
  define(
    "pkce-generator",
    "PKCE Code Generator",
    "security",
    "Generate a cryptographically random verifier and S256 challenge.",
    "",
    {
      note: "OAuth PKCE uses a 43–128 character verifier and a Base64url SHA-256 challenge. Generate a new verifier for each authorization request.",
    },
  ),
  define(
    "oauth-debugger",
    "OAuth 2.0 / OIDC Debugger",
    "security",
    "Inspect authorization URLs and callback parameters locally.",
    "https://identity.example/authorize?response_type=code&client_id=example&redirect_uri=https%3A%2F%2Fapp.example%2Fcallback&scope=openid%20profile&state=example&code_challenge=example&code_challenge_method=S256",
    {
      note: "Authorization code exchanges happen at a token endpoint; PKCE binds the code to its client. Client credentials are for confidential machine clients. Example: POST /token with grant_type=client_credentials (use placeholders, never embed a real secret).",
    },
  ),
  define(
    "jwks-explorer",
    "JWKS Explorer",
    "security",
    "Inspect public JSON Web Key Sets and key metadata.",
    '{"keys":[{"kty":"RSA","kid":"example","alg":"RS256","use":"sig","n":"AQAB","e":"AQAB"}]}',
    {
      note: "Optional HTTPS retrieval is direct from your browser and requires CORS. Only public keys should be used.",
    },
  ),
  define(
    "oidc-discovery",
    "OIDC Discovery Inspector",
    "security",
    "Explore issuer, endpoints, scopes and supported OIDC algorithms.",
    '{"issuer":"https://identity.example","authorization_endpoint":"https://identity.example/authorize","token_endpoint":"https://identity.example/token","jwks_uri":"https://identity.example/keys","response_types_supported":["code"],"subject_types_supported":["public"],"id_token_signing_alg_values_supported":["RS256"],"scopes_supported":["openid","profile"]}',
    {
      note: "Paste metadata or optionally retrieve an HTTPS discovery document in your browser. Issuer identifies the authority; jwks_uri publishes verification keys. Remote servers see your IP and must allow CORS.",
    },
  ),
  define(
    "saml-decoder",
    "SAML Decoder",
    "security",
    "Decode XML, Base64 POST and deflated Redirect binding messages.",
    '<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"><saml:Issuer>https://identity.example</saml:Issuer><saml:Subject><saml:NameID>ada@example.com</saml:NameID></saml:Subject></saml:Assertion>',
    {
      note: "Decoding does not validate XML signatures or establish trust. XML external entities are rejected.",
    },
  ),
  define(
    "oauth-scope-analyzer",
    "OAuth Scope Analyzer",
    "security",
    "Compare requested scopes with granted scopes or token claims.",
    "openid profile email",
    {
      secondary: "openid profile",
      fields: [select("delimiter", "Delimiter", ["space", ",", ";"])],
    },
  ),
  define(
    "scim-filter-validator",
    "SCIM Filter Validator",
    "security",
    "Validate SCIM 2.0 comparison, logic and value-path filters.",
    'userName eq "ada" and emails[type eq "work" and value co "@example.com"]',
    {
      note: "RFC 7644 operators: eq ne co sw ew pr gt ge lt le; logical and, or, not. Attribute names are case insensitive.",
    },
  ),
  define(
    "jwk-pem-converter",
    "JWK ↔ PEM Converter",
    "security",
    "Convert RSA and EC public keys locally between JWK and SPKI PEM.",
    "",
    {
      fields: [
        select("mode", "Direction", ["JWK to PEM", "PEM to JWK"]),
        select("algorithm", "Key algorithm", [
          "RS256",
          "ES256",
          "ES384",
          "ES512",
        ]),
      ],
      note: "Public keys only. Private-key fields and PRIVATE KEY PEM blocks are rejected. Select the algorithm matching the key curve.",
    },
  ),
  define(
    "webhook-signature-verifier",
    "Webhook Signature Verifier",
    "security",
    "Verify HMAC signatures over the exact request body.",
    "hello",
    {
      fields: [
        text("key", "Secret", "", "password"),
        text("signature", "Expected signature"),
        select("algorithm", "Algorithm", ["SHA-256", "SHA-384", "SHA-512"]),
        select("encoding", "Signature encoding", ["hex", "Base64"]),
        text("timestamp", "Optional Unix timestamp"),
        text("tolerance", "Timestamp tolerance (seconds)", "300", "number"),
        select("signed", "Signed message", ["Body only", "timestamp.body"]),
      ],
      note: "Use the exact raw body. Timestamp checking is meaningful only when the timestamp is included in the signed message.",
    },
  ),
  define(
    "aws-iam-policy-validator",
    "AWS IAM Policy Validator",
    "security",
    "Check policy structure and flag overly broad permissions.",
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:GetObject","Resource":"arn:aws:s3:::example/*"}]}',
    {
      note: "Local structural checks cannot evaluate effective permissions and are not equivalent to AWS IAM Access Analyzer.",
    },
  ),
  define(
    "webauthn-debugger",
    "Passkey / WebAuthn Debugger",
    "security",
    "Inspect clientDataJSON and authenticator data without storing credentials.",
    '{"type":"webauthn.get","challenge":"ZXhhbXBsZQ","origin":"https://example.com","crossOrigin":false}',
    {
      fields: [
        select("mode", "Structure", [
          "Client data JSON",
          "Authenticator data",
          "Attestation object",
        ]),
        text("rpId", "Expected RP ID (optional)"),
      ],
      note: "Client data accepts JSON or Base64url. Authenticator data accepts Base64url bytes. Inspection does not verify an assertion signature.",
    },
  ),
  define(
    "http-header-analyzer",
    "HTTP Header Analyzer",
    "network",
    "Inspect security headers, CORS and caching directives.",
    "HTTP/1.1 200 OK\nContent-Type: application/json\nCache-Control: no-store\nStrict-Transport-Security: max-age=31536000\nX-Content-Type-Options: nosniff",
  ),
  define(
    "cors-debugger",
    "CORS Debugger",
    "network",
    "Simulate origin, method and header compatibility.",
    "Access-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Methods: GET, POST\nAccess-Control-Allow-Headers: content-type",
    {
      fields: [
        text("origin", "Request origin", "https://app.example"),
        text("method", "Request method", "GET"),
        text("headers", "Request header names", "content-type"),
        select("credentials", "Credentials", ["No", "Yes"]),
      ],
      note: "Simulation only. Browsers enforce CORS; this tool cannot bypass it. Non-simple requests require an OPTIONS preflight.",
    },
  ),
  define(
    "http-to-curl",
    "HTTP Request to cURL",
    "network",
    "Turn a raw HTTP request into a safely quoted POSIX shell command.",
    'POST https://api.example.com/users?active=true HTTP/1.1\nContent-Type: application/json\n\n{"name":"Ada"}',
    {
      note: "Paste method, absolute URL, headers and optional body. For forms use application/x-www-form-urlencoded. Query parameters are preserved. Review sensitive Authorization headers before sharing.",
      language: "bash",
    },
  ),
  define(
    "subnet-calculator",
    "IPv4 Subnet Calculator",
    "network",
    "Calculate network, broadcast, masks and usable address ranges.",
    "192.168.1.42/24",
  ),
  define(
    "ssl-certificate-inspector",
    "SSL Certificate Inspector",
    "network",
    "Inspect an HTTPS server certificate and its presented chain.",
    "example.com",
    {
      remote: true,
      note: "Server diagnostic: only the public hostname is sent to our server. HTTPS port 443 only; public DNS addresses only. No redirects or custom ports. TLS metadata inspection does not replace a full trust audit.",
    },
  ),
  define(
    "timestamp-converter",
    "Unix Timestamp Converter",
    "time",
    "Convert Unix seconds, milliseconds and ISO dates across timezones.",
    "1700000000",
    {
      fields: [
        select("unit", "Numeric unit", ["seconds", "milliseconds"]),
        select("timezone", "Display timezone", [
          "UTC",
          "America/Chicago",
          "America/New_York",
          "Europe/London",
          "Europe/Paris",
          "Asia/Tokyo",
          "Asia/Kolkata",
          "Australia/Sydney",
        ]),
      ],
    },
  ),
  define(
    "cron-generator",
    "Cron Expression Generator",
    "time",
    "Build and explain standard five-field cron with upcoming runs.",
    "*/15 * * * *",
    {
      fields: [
        select("timezone", "Timezone", [
          "UTC",
          "America/Chicago",
          "America/New_York",
          "Europe/London",
          "Asia/Tokyo",
        ]),
        text("minute", "Minute", "*/15"),
        text("hour", "Hour", "*"),
        text("day", "Day of month", "*"),
        text("month", "Month", "*"),
        text("weekday", "Day of week", "*"),
      ],
      note: "Standard five-field cron: minute hour day month weekday. Day fields use OR semantics. Next runs use the selected timezone and its DST rules.",
    },
  ),
  define(
    "uuid-generator",
    "UUID Generator & Validator",
    "generators",
    "Generate UUID v4/v7 in bulk or inspect an existing identifier.",
    "",
    {
      fields: [
        select("mode", "Operation", ["Generate", "Validate"]),
        select("version", "Version", ["v4", "v7"]),
        text("count", "Count (1–1000)", "1", "number"),
      ],
    },
  ),
  define(
    "password-generator",
    "Password / Passphrase Generator",
    "generators",
    "Generate secure random passwords and memorable passphrases.",
    "",
    {
      fields: [
        select("mode", "Mode", ["Password", "Passphrase"]),
        text("length", "Password length / word count", "20", "number"),
        select("uppercase", "Uppercase", ["Yes", "No"]),
        select("lowercase", "Lowercase", ["Yes", "No"]),
        select("digits", "Digits", ["Yes", "No"]),
        select("symbols", "Symbols", ["Yes", "No"]),
        select("ambiguous", "Exclude ambiguous characters", ["Yes", "No"]),
      ],
      note: "Generated using browser cryptographic randomness. Entropy estimates describe the generator, not resistance to phishing or reuse. Nothing is transmitted or saved.",
    },
  ),
];
export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
