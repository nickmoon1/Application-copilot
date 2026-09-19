import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true);

const args = process.argv.slice(2);
const command = args.join(" ");

if (!["generate", "validate", "migrate deploy"].includes(command)) {
  throw new Error("Supported commands: generate, validate, migrate deploy.");
}

if (command === "migrate deploy" && (!process.env.DATABASE_URL || !process.env.DIRECT_URL)) {
  throw new Error("Set DATABASE_URL and DIRECT_URL before applying migrations.");
}

const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", ...args, "--schema", "prisma/schema.prisma"],
  { stdio: "inherit", env: process.env },
);

if (result.error) throw new Error("Could not start Prisma.");
process.exitCode = result.status ?? 1;
