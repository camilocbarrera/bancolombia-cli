import { saveConfig } from "../config";
import { getAccounts } from "../services/account";
import { browserLogin, BrowserLoginError, PlaywrightMissingError } from "../services/browser-login";
import { formatCOP, formatAccountType } from "../formatters";
import { printDetail, printTable, withSpinner, ok, fail, bancoYellowBold, dim, bold, success, hint } from "../ui";

const argUser = process.argv[2];
const argPin = process.argv[3];
const automated = Boolean(argUser && argPin);

if ((argUser && !argPin) || (!argUser && argPin)) {
  console.log(`\n${fail("Both <user> and <pin> are required for headless login")}\n`);
  console.log(`  ${hint("bancolombia login")}                    ${dim("interactive browser login")}`);
  console.log(`  ${hint("bancolombia login <user> <pin>")}       ${dim("headless automated login")}\n`);
  process.exit(1);
}

console.log(`\n  ${bancoYellowBold("Bancolombia CLI Login")}`);
console.log(
  `  ${dim(automated ? "Logging in headlessly..." : "Opening browser — log in to your Bancolombia account...")}\n`
);

if (!automated) {
  console.log(`  ${dim("Waiting for you to log in...")}`);
  console.log(`  ${dim("(The browser will close automatically after login)")}\n`);
}

let result;
try {
  result = await browserLogin({ user: argUser, pin: argPin });
} catch (err) {
  if (err instanceof PlaywrightMissingError) {
    console.log(`\n${fail("Playwright is not installed")}\n`);
    console.log(`  The ${bold("bancolombia login")} command uses a browser to capture your session.`);
    console.log(`  To use it, install Playwright:\n`);
    console.log(`    ${hint("bun add playwright playwright-extra puppeteer-extra-plugin-stealth")}\n`);
    console.log(`  Or use the API proxy login instead:\n`);
    console.log(`    ${hint("bancolombia connect <username> <pin> [api-url]")}\n`);
    process.exit(1);
  }
  if (err instanceof BrowserLoginError) {
    console.log(`\n${fail(err.message)}\n`);
    process.exit(1);
  }
  console.log(`\n${fail(`Login failed: ${(err as Error).message}`)}\n`);
  if (automated) console.log(`  Try ${hint("bancolombia login")} for interactive login.\n`);
  process.exit(1);
}

const { config, stealth } = result;
console.log(`${ok("Session captured!")} ${dim("Verifying...")}`);

await saveConfig(config);

let accounts;
try {
  accounts = await withSpinner("Loading accounts...", () => getAccounts(config));
} catch {}

printDetail("Connected to Bancolombia", [
  ["Mode", success(automated ? "Direct (headless login)" : "Direct (browser login)")],
  ["Stealth", stealth ? success("on") : dim("off")],
  ["Expires", new Date(config.expiresAt).toLocaleString("es-CO")],
]);

if (accounts?.length) {
  printTable({
    title: "Your Accounts",
    head: ["Type", "Number", "Name", "Balance"],
    rows: accounts.map((a) => [
      formatAccountType(a.type),
      a.number,
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
