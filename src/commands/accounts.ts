import { loadConfig } from "../config";
import { getAccounts } from "../services/account";
import { formatCOP, formatAccountType, maskAccount } from "../formatters";
import { printTable, withSpinner, fail, warn } from "../ui";
import { BancolombiaError } from "../http";

const config = await loadConfig().catch((e: Error) => {
  console.error(`\n${fail(e.message)}\n`);
  process.exit(1);
});

let accounts;
try {
  accounts = await withSpinner("Loading accounts...", () => getAccounts(config));
} catch (e: any) {
  if (e instanceof BancolombiaError && e.isSessionExpired) {
    console.error(`\n  ${warn("Session expired.")} Run ${warn("bancolombia login")} to reconnect.\n`);
  } else {
    console.error(`\n${fail(e.message)}\n`);
  }
  process.exit(1);
}

printTable({
  title: "Accounts",
  head: ["ID", "Type", "Number", "Name", "Balance", "Currency"],
  rows: accounts.map((a) => [
    a.id,
    formatAccountType(a.type),
    maskAccount(a.number),
    a.name,
    formatCOP(a.balance),
    a.currency,
  ]),
});
console.log();
