import { loadConfig } from "../config";
import { getAccounts } from "../services/account";
import { formatCOP, formatAccountType, maskAccount } from "../formatters";
import { printDetail, printTable, withSpinner, success, dim, warn, fail } from "../ui";

const config = await loadConfig().catch((e: Error) => {
  console.error(`\n${fail(e.message)}\n`);
  process.exit(1);
});

const expiresAt = new Date(config.expiresAt);
const now = new Date();
const isExpired = expiresAt < now;
const minutesLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / 60000));

const mode = config.mode === "direct" ? "Direct (browser login)" : "API proxy";

printDetail("Session Info", [
  ["Bank", "Bancolombia"],
  ["Mode", mode],
  ...(config.mode === "api" ? [["API URL", config.apiUrl] as [string, string]] : []),
  ["Expires", expiresAt.toLocaleString("es-CO")],
  ["Status", isExpired ? warn("Expired") : success(`Active (${minutesLeft}min left)`)],
]);

if (!isExpired) {
  try {
    const accounts = await withSpinner("Loading accounts...", () => getAccounts(config));
    if (accounts.length) {
      printTable({
        title: "Accounts",
        head: ["Type", "Number", "Name", "Balance"],
        rows: accounts.map((a) => [
          formatAccountType(a.type),
          maskAccount(a.number),
          a.name,
          formatCOP(a.balance),
        ]),
      });
      console.log();
    }
  } catch {
    console.log(`  ${dim("Could not load accounts (session may have expired).")}\n`);
  }
}
