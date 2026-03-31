import { loadConfig } from "../config";
import { getTransactions } from "../services/transaction";
import { formatCOP, formatDate } from "../formatters";
import { printTable, withSpinner, success, error, dim, fail, warn } from "../ui";
import { BancolombiaError } from "../http";

const accountId = process.argv[2];
const from = process.argv[3];
const to = process.argv[4];

if (!accountId || !from || !to) {
  console.error("Usage: bancolombia transactions <account-id> <from> <to>");
  console.error("\n  account-id   Account ID (from 'bancolombia accounts')");
  console.error("  from         Start date (YYYY-MM-DD)");
  console.error("  to           End date (YYYY-MM-DD)");
  console.error("\nExample:");
  console.error("  bancolombia transactions 69870233906 2026-02-01 2026-03-31");
  process.exit(1);
}

const config = await loadConfig().catch((e: Error) => {
  console.error(`\n${fail(e.message)}\n`);
  process.exit(1);
});

let transactions;
try {
  transactions = await withSpinner("Loading transactions...", () =>
    getTransactions(accountId, from, to, config)
  );
} catch (e: any) {
  if (e instanceof BancolombiaError && e.isSessionExpired) {
    console.error(`\n  ${warn("Session expired.")} Run ${warn("bancolombia login")} to reconnect.\n`);
    process.exit(1);
  }
  if (e.message?.includes("no tienes movimientos") || e.message?.includes("no encontrados")) {
    console.log(`\n  ${dim("No transactions found for the given period.")}\n`);
    process.exit(0);
  }
  console.error(`\n${fail(e.message)}\n`);
  process.exit(1);
}

if (!transactions.length) {
  console.log(`\n  ${dim("No transactions found for the given period.")}\n`);
  process.exit(0);
}

const totalCredit = transactions
  .filter((t) => t.type === "credit")
  .reduce((sum, t) => sum + t.amount, 0);
const totalDebit = transactions
  .filter((t) => t.type === "debit")
  .reduce((sum, t) => sum + Math.abs(t.amount), 0);

printTable({
  title: `Transactions (${from} to ${to})`,
  head: ["Date", "Description", "Amount", "Type", "Reference"],
  rows: transactions.map((t) => [
    formatDate(t.date),
    t.description,
    t.type === "credit"
      ? success(formatCOP(t.amount))
      : error(formatCOP(t.amount)),
    t.type === "credit" ? success("IN") : error("OUT"),
    t.reference || null,
  ]),
});

console.log(`\n  ${dim("Summary:")}`);
console.log(`  ${success("Total In:")}  ${formatCOP(totalCredit)}`);
console.log(`  ${error("Total Out:")} ${formatCOP(totalDebit)}`);
console.log(`  ${dim("Net:")}       ${formatCOP(totalCredit - totalDebit)}`);
console.log();
