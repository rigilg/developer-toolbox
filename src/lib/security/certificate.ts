import { lookup } from "node:dns/promises";
import { connect, type DetailedPeerCertificate } from "node:tls";
import ipaddr from "ipaddr.js";
export function validateHostname(value: unknown): string {
  if (typeof value !== "string" || value.length > 253)
    throw Error("Supply a public DNS hostname (maximum 253 characters).");
  const hostname = value.trim().toLowerCase().replace(/\.$/, "");
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
      hostname,
    ) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  )
    throw Error("Use a public hostname only, without URL, port or path.");
  return hostname;
}
export function publicAddress(address: string) {
  try {
    return ipaddr.parse(address).range() === "unicast";
  } catch {
    return false;
  }
}
export async function inspectCertificate(hostname: string) {
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const records = await Promise.race([
    lookup(hostname, { all: true }),
    new Promise<never>((_, reject) => {
      dnsTimer = setTimeout(
        () => reject(Error("DNS resolution timed out.")),
        2500,
      );
    }),
  ]).finally(() => {
    if (dnsTimer) clearTimeout(dnsTimer);
  });
  if (!records.length || records.some((r) => !publicAddress(r.address)))
    throw Error("DNS resolves to a non-public or reserved address.");
  const selected = records[0];
  return new Promise((resolve, reject) => {
    let done = false;
    const socket = connect({
      host: selected.address,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    });
    const finish = (error?: Error, data?: unknown) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve(data);
    };
    const timer = setTimeout(
      () => finish(Error("TLS connection timed out.")),
      5000,
    );
    socket.once("error", () =>
      finish(Error("Unable to establish a TLS connection.")),
    );
    socket.once("secureConnect", () => {
      const peer = socket.getPeerCertificate(true);
      if (!peer || !Object.keys(peer).length)
        return finish(Error("The server did not present a certificate."));
      const chain: unknown[] = [];
      const seen = new Set<string>();
      let c: DetailedPeerCertificate | undefined = peer;
      while (c && chain.length < 10 && !seen.has(c.fingerprint256)) {
        seen.add(c.fingerprint256);
        chain.push({
          subject: c.subject,
          issuer: c.issuer,
          subjectAlternativeNames: c.subjectaltname,
          validFrom: c.valid_from,
          validTo: c.valid_to,
          serialNumber: c.serialNumber,
          fingerprint256: c.fingerprint256,
          expired: Date.parse(c.valid_to) < Date.now(),
        });
        c = c.issuerCertificate;
      }
      finish(undefined, {
        hostname,
        authorized: socket.authorized,
        authorizationError: socket.authorizationError
          ? String(socket.authorizationError)
          : null,
        protocol: socket.getProtocol(),
        chain,
        limitation:
          "Presented chain only; trust uses the server runtime CA store. No revocation or certificate-transparency audit.",
      });
    });
  });
}
