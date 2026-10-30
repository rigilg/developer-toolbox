import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy & Security",
  alternates: { canonical: "/privacy" },
};
export default function Privacy() {
  return (
    <article className="prose-page">
      <div className="eyebrow">PRIVACY BY DESIGN</div>
      <h1>Your data is your business.</h1>
      <p>
        Developer Toolbox does not require an account, run analytics, log
        utility inputs, or save your tokens, secrets, files, or generated
        passwords.
      </p>
      <h2>Local processing</h2>
      <p>
        Formatting, encoding, crypto verification and generation run in your
        browser. Inputs are held in memory and disappear when you leave or clear
        the page. Downloads are created locally. Clipboard writes happen only
        when you request them.
      </p>
      <h2>Two explicit network features</h2>
      <p>
        SSL Certificate Inspector sends only the hostname you submit to our
        diagnostic endpoint, which resolves public DNS and connects to HTTPS
        port 443. JWKS and OIDC optional retrieval contact the HTTPS provider
        directly from your browser without cookies or credentials. That provider
        sees your IP address and request. Paste metadata instead to keep
        processing fully local.
      </p>
      <h2>Browser storage</h2>
      <p>
        Only theme preference, saved tool identifiers and recent tool
        identifiers are stored locally. No utility inputs or results are
        persisted. Clear browser site data to remove these preferences.
      </p>
      <h2>Hosting</h2>
      <p>
        Our hosting provider may process ordinary connection metadata such as IP
        addresses, requested page paths, response codes and timing for delivery
        and security. Sensitive inputs are never placed in page URLs. Do not
        enter confidential data into optional remote URLs.
      </p>
      <h2>Security boundaries</h2>
      <p>
        Decoded data is displayed as text. JWT and SAML decoding does not
        establish trust. Local IAM and protocol checks are advisory and do not
        replace provider validation or a security audit. The server diagnostic
        limits input, public destinations, connection time and request
        frequency.
      </p>
      <p>
        Questions? <a href="https://rigilgilbert.com">Contact Rigil Gilbert</a>.
      </p>
    </article>
  );
}
