import { loadConfig } from "../config";
import { getAccounts } from "../services/account";
import { formatCOP, formatAccountType } from "../formatters";
import { printDetail, withSpinner, success, bancoYellowBold, fail, warn } from "../ui";
import { BancolombiaError } from "../http";

const config = await loadConfig().catch((e: Error) => {
  console.error(`\n${fail(e.message)}\n`);
  process.exit(1);
});

let accounts;
try {
  accounts = await withSpinner("Checking balances...", () => getAccounts(config));
} catch (e: any) {
  if (e instanceof BancolombiaError && e.isSessionExpired) {
    console.error(`\n  ${warn("Session expired.")} Run ${warn("bancolombia login")} to reconnect.\n`);
  } else {
    console.error(`\n${fail(e.message)}\n`);
  }
  process.exit(1);
}

if (!accounts.length) {
  console.log("\n  No accounts found.\n");
  process.exit(0);
}

for (const account of accounts) {
  printDetail(`${formatAccountType(account.type)} ****${account.number.slice(-4)}`, [
    ["Name", account.name],
    ["Number", account.number],
    ["Balance", `${bancoYellowBold(formatCOP(account.balance))} ${account.currency}`],
    ["Status", success("Active")],
  ]);
}
