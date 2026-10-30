import { NextRequest, NextResponse } from "next/server";
import {
  validateHostname,
  inspectCertificate,
} from "@/lib/security/certificate";
export const runtime = "nodejs";
export const maxDuration = 15;
const buckets = new Map<string, { count: number; reset: number }>();
let active = 0;
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Cross-origin diagnostics are not allowed." },
      { status: 403, headers },
    );
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
    "shared";
  const now = Date.now();
  for (const [key, b] of buckets) if (b.reset < now) buckets.delete(key);
  const b = buckets.get(ip) || { count: 0, reset: now + 60000 };
  buckets.set(ip, b);
  if (++b.count > 10 || active >= 8 || buckets.size > 10000)
    return NextResponse.json(
      { error: "Diagnostic rate limit reached. Try again in one minute." },
      { status: 429, headers: { ...headers, "Retry-After": "60" } },
    );
  let timer: ReturnType<typeof setTimeout> | undefined;
  let counted = false;
  try {
    if (Number(request.headers.get("content-length") || 0) > 1024)
      throw Error("Request too large.");
    const reader = request.body?.getReader();
    if (!reader) throw Error("Request body required.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 1024) {
        await reader.cancel();
        throw Error("Request too large.");
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const hostname = validateHostname(JSON.parse(raw).hostname);
    active++;
    counted = true;
    const data = await Promise.race([
      inspectCertificate(hostname),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error("Diagnostic timed out.")), 8000);
      }),
    ]);
    return NextResponse.json(data, { headers });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400, headers },
    );
  } finally {
    if (timer) clearTimeout(timer);
    if (counted) active = Math.max(0, active - 1);
  }
}
