"use client";
import { useState, useEffect, useRef } from "react";
import {
  Play,
  Copy,
  Check,
  Download,
  RotateCcw,
  Lightbulb,
  LockKeyhole,
  Upload,
  Globe,
} from "lucide-react";
import type { ToolDefinition, Options, ToolResult } from "@/lib/tools/types";
import { getRunner } from "@/lib/tools/runner";
import { Button } from "../ui/button";
import { ResultExtras } from "./result-extras";
function initial(tool: ToolDefinition) {
  return Object.fromEntries(
    (tool.fields || []).map((f) => [f.key, f.default || ""]),
  );
}
function Highlight({ text, language }: { text: string; language?: string }) {
  if (
    !["json", "xml", "sql", "typescript", "java", "bash", "yaml"].includes(
      language || "",
    )
  )
    return <>{text}</>;
  const parts = text.split(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:true|false|null|SELECT|FROM|WHERE|public|private|class|interface|export|type|String|Boolean|Long)\b|\b\d+(?:\.\d+)?\b|<\/?[\w:-]+|[{}[\]])/g,
  );
  return (
    <>
      {parts.map((p, n) => (
        <span
          key={n}
          className={
            /^['"]/.test(p)
              ? "syntax-string"
              : /^(true|false|null|SELECT|FROM|WHERE|public|private|class|interface|export|type|String|Boolean|Long)$/.test(
                    p,
                  )
                ? "syntax-keyword"
                : /^\d/.test(p)
                  ? "syntax-number"
                  : /^<|^[{}[\]]/.test(p)
                    ? "syntax-punctuation"
                    : undefined
          }
        >
          {p}
        </span>
      ))}
    </>
  );
}
export function Workbench({ tool }: { tool: ToolDefinition }) {
  const [input, setInput] = useState("");
  const [secondary, setSecondary] = useState("");
  const [options, setOptions] = useState<Options>(initial(tool));
  const [output, setOutput] = useState<ToolResult>({ text: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remote, setRemote] = useState("");
  const [now, setNow] = useState<number>();
  const [file, setFile] = useState<File | null>(null);
  const generation = useRef(0);
  const runRef = useRef<() => void>(() => {});
  useEffect(() => {
    try {
      const old = JSON.parse(localStorage.getItem("toolbox-recent") || "[]");
      localStorage.setItem(
        "toolbox-recent",
        JSON.stringify(
          [tool.slug, ...old.filter((s: string) => s !== tool.slug)].slice(
            0,
            8,
          ),
        ),
      );
    } catch {}
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", key);
    let timer: ReturnType<typeof setInterval> | undefined;
    if (tool.slug === "timestamp-converter") {
      setNow(Date.now());
      timer = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      window.removeEventListener("keydown", key);
      if (timer) clearInterval(timer);
      // This is a request counter, intentionally invalidated at cleanup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
    };
  }, [tool.slug]);
  async function run() {
    const id = ++generation.current;
    setBusy(true);
    setError("");
    setOutput({ text: "" });
    try {
      if (
        input.length > 1_000_000 ||
        secondary.length > 1_000_000 ||
        Object.values(options).some((v) => v.length > 1_000_000)
      )
        throw Error("Input limit is 1 MB per field.");
      let value: ToolResult;
      if (file && tool.slug === "hash-generator") {
        if (file.size > 20 * 1024 * 1024) throw Error("File exceeds 20 MB.");
        const { digest, bytesHex, bytesB64 } =
          await import("@/lib/tools/crypto");
        const b = await digest(
          new Uint8Array(await file.arrayBuffer()),
          options.algorithm,
        );
        value = {
          text: JSON.stringify(
            {
              filename: file.name,
              bytes: file.size,
              hex: bytesHex(b),
              base64: bytesB64(b),
            },
            null,
            2,
          ),
          language: "json",
        };
      } else
        value = await (await getRunner(tool.slug))(input, options, secondary);
      if (id === generation.current) setOutput(value);
    } catch (e) {
      if (id === generation.current)
        setError((e as Error).message || "Unable to process input.");
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  runRef.current = run;
  function clear() {
    generation.current++;
    setInput("");
    setSecondary("");
    setOutput({ text: "" });
    setOptions(initial(tool));
    setFile(null);
    setError("");
    setBusy(false);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(output.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(
        "Clipboard access was denied. Select and copy the output manually.",
      );
    }
  }
  function download() {
    const u = URL.createObjectURL(
      new Blob([output.text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = `${tool.slug}.${output.language === "json" ? "json" : output.language === "csv" ? "csv" : "txt"}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  async function retrieve() {
    setError("");
    setBusy(true);
    try {
      const u = new URL(remote);
      if (
        u.protocol !== "https:" ||
        u.username ||
        u.password ||
        (u.port && !["443"].includes(u.port)) ||
        u.hostname === "localhost" ||
        /^(?:\d|\[)/.test(u.hostname) ||
        /\.(local|internal|localhost)$/.test(u.hostname)
      )
        throw Error(
          "Use a public HTTPS URL without credentials or custom ports.",
        );
      const response = await fetch(u, {
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok)
        throw Error("Remote server returned " + response.status);
      if (Number(response.headers.get("content-length") || 0) > 1_000_000)
        throw Error("Response exceeds 1 MB.");
      const reader = response.body?.getReader();
      if (!reader) throw Error("No response body.");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const v = await reader.read();
        if (v.done) break;
        size += v.value.length;
        if (size > 1_000_000) {
          await reader.cancel();
          throw Error("Response exceeds 1 MB.");
        }
        chunks.push(v.value);
      }
      const bytes = new Uint8Array(size);
      let n = 0;
      for (const c of chunks) {
        bytes.set(c, n);
        n += c.length;
      }
      setInput(new TextDecoder().decode(bytes));
    } catch (e) {
      setError(
        "Retrieval failed: " +
          (e as Error).message +
          ". The server must allow CORS. You can paste JSON instead.",
      );
    } finally {
      setBusy(false);
    }
  }
  const generator = [
    "pkce-generator",
    "password-generator",
    "uuid-generator",
  ].includes(tool.slug);
  const noInput = generator && options.mode !== "Validate";
  return (
    <section className="workbench" aria-label={tool.name + " workbench"}>
      <div className="workbench-toolbar">
        <span className={"processing-badge " + (tool.remote ? "remote" : "")}>
          <LockKeyhole size={13} />
          {tool.remote
            ? "Public hostname sent to server"
            : "Processed in your browser"}
        </span>
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setInput(tool.example);
              setSecondary(tool.secondary || "");
              setError("");
              setOutput({ text: "" });
              setFile(null);
            }}
          >
            <Lightbulb size={15} />
            Load example
          </Button>
          <Button variant="ghost" onClick={clear}>
            <RotateCcw size={14} />
            Clear
          </Button>
        </div>
      </div>
      {tool.fields && (
        <div className="options-grid">
          {tool.fields.map((f) => (
            <label
              key={f.key}
              className={f.type === "textarea" ? "wide-field" : ""}
            >
              {f.label}
              {f.choices ? (
                <select
                  value={options[f.key]}
                  onChange={(e) =>
                    setOptions({ ...options, [f.key]: e.target.value })
                  }
                >
                  {f.choices.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={options[f.key]}
                  onChange={(e) =>
                    setOptions({ ...options, [f.key]: e.target.value })
                  }
                  spellCheck={false}
                />
              ) : (
                <input
                  autoComplete="off"
                  type={f.type || "text"}
                  value={options[f.key]}
                  onChange={(e) =>
                    setOptions({ ...options, [f.key]: e.target.value })
                  }
                  spellCheck={false}
                />
              )}
            </label>
          ))}
        </div>
      )}
      {tool.slug === "cron-generator" && (
        <div className="extra-actions">
          <Button
            variant="outline"
            onClick={() =>
              setInput(
                ["minute", "hour", "day", "month", "weekday"]
                  .map((k) => options[k])
                  .join(" "),
              )
            }
          >
            Use builder fields
          </Button>
          <span>Five fields • standard cron</span>
        </div>
      )}
      {now && (
        <div className="extra-actions">
          <span>
            Current Unix time: <strong>{Math.floor(now / 1000)}</strong>
          </span>
          <Button
            variant="ghost"
            onClick={() =>
              setInput(
                String(
                  options.unit === "milliseconds"
                    ? now
                    : Math.floor(now / 1000),
                ),
              )
            }
          >
            Use current time
          </Button>
        </div>
      )}
      {["jwks-explorer", "oidc-discovery"].includes(tool.slug) && (
        <details className="remote-fetch">
          <summary>Optional: retrieve public HTTPS metadata</summary>
          <p>
            This directly contacts the remote server from your browser. It sees
            your IP. No credentials are sent.
          </p>
          <div>
            <input
              aria-label="Public metadata URL"
              placeholder="https://identity.example/.well-known/openid-configuration"
              value={remote}
              onChange={(e) => setRemote(e.target.value)}
            />
            <Button variant="outline" disabled={busy} onClick={retrieve}>
              <Globe size={14} />
              Retrieve
            </Button>
          </div>
        </details>
      )}
      {tool.slug === "hash-generator" && (
        <label className="file-label">
          <Upload size={15} />
          Or select a local file (max 20 MB)
          <input
            aria-label="File to hash"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file && <span>{file.name}</span>}
        </label>
      )}
      <div
        className={
          "editor-grid " +
          (noInput ? "generator-layout" : "") +
          (tool.secondary !== undefined ? " comparison-layout" : "")
        }
      >
        {!noInput && (
          <div className="editor-panel">
            <div className="panel-heading">
              <label htmlFor="tool-input">
                {tool.secondary !== undefined
                  ? "Left / requested input"
                  : "Input"}
              </label>
              <span>{input.length.toLocaleString()} characters</span>
            </div>
            <textarea
              id="tool-input"
              className="code-editor"
              placeholder={tool.example || "Paste your input here…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              maxLength={1_000_001}
            />
          </div>
        )}
        {tool.secondary !== undefined && (
          <div className="editor-panel">
            <div className="panel-heading">
              <label htmlFor="secondary-input">
                {tool.slug === "diff-checker"
                  ? "Right input"
                  : "Granted scopes or JWT"}
              </label>
              <span>{secondary.length} characters</span>
            </div>
            <textarea
              id="secondary-input"
              className="code-editor secondary-editor"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              spellCheck={false}
              placeholder={tool.secondary}
            />
          </div>
        )}
        <div className="editor-panel output-panel">
          <div className="panel-heading">
            <h2>Output</h2>
            <div>
              <span>{output.text.length.toLocaleString()} characters</span>
              <button
                aria-label="Copy output"
                onClick={copy}
                disabled={!output.text}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
              <button
                aria-label="Download output"
                onClick={download}
                disabled={!output.text}
              >
                <Download size={15} />
              </button>
            </div>
          </div>
          <div
            className="output-region"
            role="region"
            aria-label="Tool output"
            tabIndex={0}
          >
            {output.text ? (
              <pre>
                {output.highlights ? (
                  output.highlights.map((v, n) => (
                    <span key={n} className={"diff-" + v.kind}>
                      {v.value}
                    </span>
                  ))
                ) : (
                  <Highlight text={output.text} language={output.language} />
                )}
              </pre>
            ) : (
              <div className="output-placeholder">
                <span aria-hidden="true">{"{ }"}</span>
                <p>Your result will appear here</p>
                <small>
                  {generator
                    ? "Generate something useful."
                    : "Add an input and run the tool to get started."}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
      <ResultExtras slug={tool.slug} text={output.text} input={input} />
      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}
      <div className="run-bar">
        <Button onClick={run} disabled={busy}>
          <Play size={15} />
          {busy
            ? "Working…"
            : tool.remote
              ? "Inspect certificate"
              : generator && options.mode !== "Validate"
                ? "Generate"
                : "Run tool"}
          <kbd>⌘ ↵</kbd>
        </Button>
        <span aria-live="polite">
          {copied
            ? "Copied to clipboard"
            : busy
              ? "Processing…"
              : output.text
                ? "Done. Your input has not been saved."
                : tool.remote
                  ? "Only a public hostname leaves your browser."
                  : "No input is sent to a server."}
        </span>
      </div>
      {tool.note && (
        <aside className="tool-note">
          <Lightbulb size={17} />
          <p>{tool.note}</p>
        </aside>
      )}
    </section>
  );
}
