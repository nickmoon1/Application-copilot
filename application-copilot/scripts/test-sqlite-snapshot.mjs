import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalRows, normalizeSqliteDate } from "./lib/sqlite-snapshot.mjs";

test("Prisma epoch milliseconds retain precision", () => {
  const milliseconds = Date.UTC(2026, 8, 17, 12, 30, 0, 123);
  assert.equal(normalizeSqliteDate(milliseconds).getTime(), milliseconds);
});
test("SQLite timestamps without a timezone are interpreted as UTC", () => {
  assert.equal(normalizeSqliteDate("2026-09-17 12:30:00").toISOString(), "2026-09-17T12:30:00.000Z");
});
test("ISO offsets are retained as the equivalent instant", () => {
  assert.equal(normalizeSqliteDate("2026-09-17T07:30:00-05:00").toISOString(), "2026-09-17T12:30:00.000Z");
});
test("Unsupported dates fail instead of silently changing history", () => {
  for (const value of [null, "", "yesterday", NaN]) assert.throws(() => normalizeSqliteDate(value));
});
test("Verification normalizes row and field order, but preserves values", () => {
  const first = canonicalRows([{ id: "b", status: "SUBMITTED" }, { id: "a", status: "INVALID_JOB" }], "id");
  const second = canonicalRows([{ status: "INVALID_JOB", id: "a" }, { status: "SUBMITTED", id: "b" }], "id");
  assert.deepEqual(first, second);
});
