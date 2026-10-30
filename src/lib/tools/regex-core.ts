import { required } from "./types";
export function evaluateRegex(input: string, pattern: string, flags: string) {
  required(pattern, "Pattern");
  if (pattern.length > 2000 || input.length > 100000)
    throw Error(
      "Regex limit: 2,000 pattern characters and 100,000 text characters.",
    );
  const re = new RegExp(pattern, flags);
  const matches = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    matches.push({
      match: m[0],
      index: m.index,
      groups: m.slice(1),
      namedGroups: m.groups,
    });
    if (matches.length >= 1000) break;
    if (!re.global && !re.sticky) break;
    if (m[0] === "") {
      const point = input.codePointAt(re.lastIndex);
      re.lastIndex +=
        re.unicode && point !== undefined && point > 0xffff ? 2 : 1;
    }
  }
  return { matches, count: matches.length, truncated: matches.length === 1000 };
}
