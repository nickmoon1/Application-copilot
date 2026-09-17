import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";

nextEnv.loadEnvConfig(process.cwd(), true);

const origin = new URL(process.argv[2] ?? "http://localhost:3100");
assert.equal(origin.protocol, "http:", "Run this test against a local HTTP server only.");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname), "Test tokens must stay on loopback.");
const secret = process.env.NEXTAUTH_SECRET;
const githubId = process.env.AUTH_ALLOWED_GITHUB_ID?.trim();
assert.ok(secret && githubId, "Configure NEXTAUTH_SECRET and AUTH_ALLOWED_GITHUB_ID first.");

async function request(path, options = {}) {
  return fetch(new URL(path, origin), { ...options, redirect: "manual" });
}

async function sessionCookie(id) {
  const token = await encode({ secret, token: { githubId: id }, maxAge: 60 });
  return `next-auth.session-token=${token}`;
}

assert.equal((await request("/api/applications")).status, 401);
assert.equal((await request("/github/create-pr", { method: "POST" })).status, 303);
assert.equal((await request("/api/applications", {
  headers: { Cookie: await sessionCookie(`${githubId}-not-allowed`) },
})).status, 401);

const response = await request("/github/create-pr", {
  method: "POST",
  headers: {
    Cookie: await sessionCookie(githubId),
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "company=&role=&location=",
});
assert.equal(response.status, 303);
const destination = new URL(response.headers.get("location"), origin);
assert.equal(destination.searchParams.get("error"), "Missing required field: company");

console.log("PASS: signed-out access, wrong-account access, and authenticated Create PR form validation.");
