import { v4, v7, validate, version } from "uuid";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";
import { result, required, type Run } from "./types";
export const timestamp: Run = (i, o) => {
  required(i);
  let d: Date;
  if (/^-?\d+(?:\.\d+)?$/.test(i.trim()))
    d = new Date(Number(i) * (o.unit === "milliseconds" ? 1 : 1000));
  else {
    if (
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(
        i,
      )
    )
      throw Error(
        "Use a Unix number or ISO 8601 date with timezone, e.g. 2026-01-01T00:00:00Z.",
      );
    const [year, month, day] = i.slice(0, 10).split("-").map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12 || day < 1 || day > days[month - 1])
      throw Error("Invalid calendar date.");
    d = new Date(i);
  }
  if (!Number.isFinite(d.getTime()))
    throw Error("Date is outside the supported range.");
  return result({
    unixSeconds: Math.floor(d.getTime() / 1000),
    unixMilliseconds: d.getTime(),
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: d.toString(),
    selectedTimezone: o.timezone || "UTC",
    formatted: new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: o.timezone || "UTC",
    }).format(d),
  });
};
export const cron: Run = (i, o) => {
  required(i);
  if (i.trim().split(/\s+/).length !== 5)
    throw Error("Use exactly five fields: minute hour day month weekday.");
  const iterator = CronExpressionParser.parse(i, { tz: o.timezone || "UTC" });
  const runs = Array.from({ length: 10 }, () => iterator.next().toDate());
  return result({
    dialect: "Standard five-field cron",
    description: cronstrue.toString(i),
    timezone: o.timezone || "UTC",
    nextRuns: runs.map((d) => ({
      iso: d.toISOString(),
      local: new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "long",
        timeZone: o.timezone || "UTC",
      }).format(d),
    })),
    dst: "Timezone rules determine offsets. Review skipped/repeated local times around DST for your scheduler.",
  });
};
export const uuid: Run = (i, o) => {
  if (o.mode === "Validate") {
    required(i);
    if (!validate(i.trim())) throw Error("Invalid UUID syntax or variant.");
    return result({ valid: true, version: version(i.trim()), uuid: i.trim() });
  }
  const n = Number(o.count || 1);
  if (!Number.isInteger(n) || n < 1 || n > 1000)
    throw Error("Count must be an integer from 1 to 1000.");
  return result(
    Array.from({ length: n }, () => (o.version === "v7" ? v7() : v4())).join(
      "\n",
    ),
    "text",
  );
};
export function randomIndex(max: number) {
  if (max < 1 || max > 2 ** 32) throw Error("Invalid random range.");
  const limit = Math.floor(2 ** 32 / max) * max;
  const a = new Uint32Array(1);
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % max;
}
// Curated local vocabulary; the entropy estimate explicitly reflects this small list.
export const words =
  "acorn amber anchor apple arrow atlas autumn badger bamboo barley basil beach beacon birch blossom blue breeze bridge brook cedar cherry clay cloud clover coast comet coral cotton creek crystal dawn delta desert dew drift dune eagle earth echo elm ember falcon feather fern field finch flame flint flower forest frost galaxy garden garnet ginger glacier glade golden granite grape grass green grove harbor hazel heron hill honey horizon ice indigo iris island ivory jade jasmine juniper kite lake lantern laurel lavender leaf lemon light lilac lily lime linen lotus lunar maple marble meadow mint mist moon moss mountain nectar night north oak ocean olive onyx opal orange orchid otter owl palm panda peach pearl pebble pine plum pond poppy prairie quartz quill rain raven reed reef river robin rock rose ruby sage sand scarlet sea seed shadow shore silver sky slate snow solar south sparrow spring spruce star stone storm stream summit sun swift teal thorn thyme tide tiger timber topaz tulip valley velvet violet walnut wave west wheat willow wind winter wolf wood wren yellow zenith".split(
    " ",
  );
export const password: Run = (_i, o) => {
  const length = Number(o.length || 20);
  if (!Number.isInteger(length)) throw Error("Length must be an integer.");
  if (o.mode === "Passphrase") {
    if (length < 4 || length > 32)
      throw Error("Choose 4–32 words for a passphrase.");
    return result({
      passphrase: Array.from(
        { length },
        () => words[randomIndex(words.length)],
      ).join("-"),
      estimatedEntropyBits: Math.round(length * Math.log2(words.length)),
      wordListSize: words.length,
      estimate:
        "Uniform independent word selection; does not account for compromise, phishing or reuse.",
    });
  }
  if (length < 4 || length > 256) throw Error("Password length must be 4–256.");
  let sets = [
    o.uppercase !== "No" ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    o.lowercase !== "No" ? "abcdefghijklmnopqrstuvwxyz" : "",
    o.digits !== "No" ? "0123456789" : "",
    o.symbols !== "No" ? "!@#$%^&*()-_=+[]{};:,.?" : "",
  ].filter(Boolean);
  if (o.ambiguous !== "No") sets = sets.map((s) => s.replace(/[Il1O0o]/g, ""));
  if (!sets.length) throw Error("Enable at least one character set.");
  const alphabet = sets.join("");
  let value: string;
  do {
    value = Array.from(
      { length },
      () => alphabet[randomIndex(alphabet.length)],
    ).join("");
  } while (!sets.every((s) => [...value].some((c) => s.includes(c))));
  return result({
    password: value,
    estimatedEntropyBitsUpperBound: Math.round(
      length * Math.log2(alphabet.length),
    ),
    estimate:
      "Upper bound before required character-set conditioning. Random generation only; not a guarantee against compromise.",
  });
};
