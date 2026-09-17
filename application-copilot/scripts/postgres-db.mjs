import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true);
const args = process.argv.slice(2);
if (!["generate", "validate"].includes(args[0]) && args.join(" ") !== "migrate deploy") {
  throw new Error("Supported commands: generate, validate, migrate deploy.");
}
if (args[0] === "migrate" && (!process.env.POSTGRES_DATABASE_URL || !process.env.POSTGRES_DIRECT_URL)) {
  throw new Error("Set POSTGRES_DATABASE_URL and POSTGRES_DIRECT_URL in .env.local first.");
}
const result = spawnSync(process.execPath, [
  "node_modules/prisma/build/index.js", ...args, "--schema", "prisma/postgresql/schema.prisma",
], { stdio: "inherit", env: process.env });
if (result.error) throw new Error("Could not start Prisma.");
process.exitCode = result.status ?? 1;
