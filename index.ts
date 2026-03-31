#!/usr/bin/env bun
import { resolve, dirname } from "path";
import { readFileSync } from "fs";
import chalk from "chalk";
import { printBanner } from "./src/ui/banner";

const ROOT = dirname(Bun.main);
const command = process.argv[2];

const pkgPath = resolve(ROOT, "package.json");
const currentVersion = JSON.parse(readFileSync(pkgPath, "utf-8")).version;

const commands: Record<string, string> = {
  login: "src/commands/login.ts",
  connect: "src/commands/connect.ts",
  logout: "src/commands/logout.ts",
  accounts: "src/commands/accounts.ts",
  balance: "src/commands/balance.ts",
  transactions: "src/commands/transactions.ts",
  whoami: "src/commands/whoami.ts",
  health: "src/commands/health.ts",
  server: "../server.ts",
  mcp: "src/mcp/index.ts",
};

if (!command || command === "help" || !commands[command]) {
  const d = chalk.dim;
  const c = chalk.cyan;
  const b = chalk.bold;

  await printBanner(currentVersion);

  console.log(`${b("Banking")}
  ${c("login")}                              Log in via browser (recommended)
  ${c("connect")} ${d("<user> <pin> [api-url]")}    Log in via API proxy
  ${c("logout")}                             Disconnect and clear session
  ${c("accounts")}                           List all accounts
  ${c("balance")}                            Quick balance check
  ${c("transactions")} ${d("<acct> <from> <to>")}   View transaction history

${b("Session")}
  ${c("whoami")}                             Show session info and accounts
  ${c("health")} ${d("[api-url]")}                  Check API server status

${b("API")}
  ${c("server")}                             Start REST API server (port 3200)
  ${c("mcp")}                                Start MCP server (for Claude Code)

${d("Usage:")}  bancolombia <command> [args...]
`);
  process.exit(command && command !== "help" ? 1 : 0);
}

const args = process.argv.slice(3);
const proc = Bun.spawn(["bun", "run", resolve(ROOT, commands[command]), ...args], {
  stdio: ["inherit", "inherit", "inherit"],
});
const exitCode = await proc.exited;
process.exit(exitCode);
