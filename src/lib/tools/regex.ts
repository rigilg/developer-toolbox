import { required, result, type Run } from "./types";
import { evaluateRegex } from "./regex-core";
export const regex: Run = (i, o) => {
  required(i);
  if (typeof Worker === "undefined")
    return result(evaluateRegex(i, o.pattern || "", o.flags || ""));
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../../workers/regex.worker.ts", import.meta.url),
    );
    const timer = setTimeout(() => {
      worker.terminate();
      reject(
        Error(
          "Regex exceeded the 500 ms computation limit. Simplify the expression.",
        ),
      );
    }, 500);
    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      if (e.data.error) reject(Error(e.data.error));
      else resolve(result(e.data));
    };
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      reject(Error("Regex worker failed."));
    };
    worker.postMessage({
      input: i,
      pattern: o.pattern || "",
      flags: o.flags || "",
    });
  });
};
