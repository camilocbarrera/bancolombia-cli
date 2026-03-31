import { saveConfig } from "../config";
import { connectViaApi } from "../services/auth";
import { getAccounts } from "../services/account";
import { formatCOP, formatAccountType, maskAccount } from "../formatters";
import { PROXY_API_URL } from "../constants";
import type { ApiConfig } from "../schemas/config";
import { printDetail, printTable, withSpinner, ok, dim, hint, fail } from "../ui";

const username = process.argv[2];
const password = process.argv[3];
const apiUrl = process.argv[4] || PROXY_API_URL;

if (!username || !password) {
  console.error("Usage: bancolombia connect <username> <password> [api-url]");
  console.error("\n  username    Your Bancolombia username");
  console.error("  password    Your 4-digit ATM PIN");
  console.error(`  api-url     API proxy URL (default: ${PROXY_API_URL})`);
  console.error("\nPrefer 'bancolombia login' for browser-based login (no credentials in terminal).");
  process.exit(1);
}

const session = await withSpinner("Connecting to Bancolombia...", () =>
  connectViaApi(username, password, apiUrl)
).catch((err: Error) => {
  console.error(`\n${fail(err.message)}\n`);
  process.exit(1);
});

const config: ApiConfig = {
  mode: "api",
  token: session.token,
  apiUrl,
  expiresAt: session.expiresAt,
};

await saveConfig(config);

let accounts;
try {
  accounts = await withSpinner("Loading accounts...", () => getAccounts(config));
} catch {}

printDetail("Connected to Bancolombia", [
  ["Mode", "API proxy"],
  ["Session", session.token.substring(0, 8) + "..."],
  ["Expires", new Date(session.expiresAt).toLocaleString("es-CO")],
  ["API", apiUrl],
]);

if (accounts?.length) {
  printTable({
    title: "Your Accounts",
    head: ["Type", "Number", "Name", "Balance"],
    rows: accounts.map((a) => [
      formatAccountType(a.type),
      maskAccount(a.number),
      a.name,
      formatCOP(a.balance),
    ]),
  });
}

console.log(`\n${ok("Config saved! You can now use the CLI.")}\n`);
console.log(`  ${dim("What's next?")}\n`);
console.log(`  ${hint("bancolombia accounts")}                    List your accounts`);
console.log(`  ${hint("bancolombia balance")}                     Quick balance check`);
console.log(`  ${hint("bancolombia transactions")} ${dim("<account> <from> <to>")}  View transactions\n`);
