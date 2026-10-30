import { evaluateRegex } from "../lib/tools/regex-core";
self.onmessage = (e) => {
  try {
    self.postMessage(evaluateRegex(e.data.input, e.data.pattern, e.data.flags));
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};
