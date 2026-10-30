"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button";
export function ResultExtras({
  slug,
  text,
  input,
}: {
  slug: string;
  text: string;
  input: string;
}) {
  const [copied, setCopied] = useState("");
  if (!text || !["pkce-generator", "regex-tester"].includes(slug)) return null;
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (slug === "pkce-generator")
    return (
      <div className="result-extras">
        {["code_verifier", "code_challenge"].map((k) => (
          <div className="copy-value" key={k}>
            <label>
              {k}
              <code>{String(value[k])}</code>
            </label>
            <Button
              variant="outline"
              aria-label={"Copy " + k}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(String(value[k]));
                  setCopied(k);
                  setTimeout(() => setCopied(""), 1500);
                } catch {
                  setCopied("Clipboard unavailable");
                }
              }}
            >
              {copied === k ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        ))}
        <span aria-live="polite">
          {copied === "Clipboard unavailable"
            ? copied
            : copied
              ? "Copied " + copied
              : ""}
        </span>
      </div>
    );
  const parts: React.ReactNode[] = [];
  let end = 0;
  for (const [n, m] of (
    value.matches as { index: number; match: string }[]
  ).entries()) {
    parts.push(input.slice(end, m.index));
    parts.push(<mark key={n}>{m.match || "∅"}</mark>);
    end = m.index + m.match.length;
  }
  parts.push(input.slice(end));
  return (
    <div className="result-extras">
      <h3>Highlighted matches</h3>
      <pre>{parts}</pre>
      <p>Capturing groups and match positions are listed in the output.</p>
    </div>
  );
}
