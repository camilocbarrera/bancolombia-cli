import { saveConfig } from "../config";
import { getAccounts } from "../services/account";
import { formatCOP, formatAccountType, maskAccount } from "../formatters";
import { LOGIN_URL, SESSION_TTL_MS } from "../constants";
import type { DirectConfig } from "../schemas/config";
import { printDetail, printTable, withSpinner, ok, fail, bancoYellowBold, dim, bold, success, hint } from "../ui";

let chromium: typeof import("playwright").chromium;

try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log(`\n${fail("Playwright is not installed")}\n`);
  console.log(`  The ${bold("bancolombia login")} command uses a browser to capture your session.`);
  console.log(`  To use it, install Playwright:\n`);
  console.log(`    ${hint("bun add playwright")}\n`);
  console.log(`  Or use the API proxy login instead:\n`);
  console.log(`    ${hint("bancolombia connect <username> <pin> [api-url]")}\n`);
  process.exit(1);
}

console.log(`\n  ${bancoYellowBold("Bancolombia CLI Login")}`);
console.log(`  ${dim("Opening browser — log in to your Bancolombia account...")}\n`);

const browser = await chromium.launch({
  headless: false,
  channel: "chrome",
  args: ["--window-size=1024,768", "--disable-blink-features=AutomationControlled", "--no-sandbox"],
});

const context = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  locale: "es-CO",
  timezoneId: "America/Bogota",
});

const page = await context.newPage();

let accessToken = "";
let ip = "";
let deviceId = "";
let sessionTracker = "";

page.on("request", (req) => {
  const headers = req.headers();
  if (headers["session-tracker"]) sessionTracker = headers["session-tracker"];
  if (headers["device-id"]) deviceId = headers["device-id"];
  if (headers["ip"]) ip = headers["ip"];
});

page.on("response", async (res) => {
  if (res.url().includes("oauth2/token") && res.status() === 200) {
    try {
      const body = await res.json();
      accessToken = (body as any).data?.accessToken ?? "";
    } catch {}
  }
});

await page.goto(LOGIN_URL, {
  waitUntil: "domcontentloaded",
  timeout: 30_000,
});

console.log(`  ${dim("Waiting for you to log in...")}`);
console.log(`  ${dim("(The browser will close automatically after login)")}\n`);

const timeout = 5 * 60 * 1000;
const start = Date.now();

while (!accessToken && Date.now() - start < timeout) {
  await new Promise((r) => setTimeout(r, 2000));
}

// Capture cookies before closing
let cookieStr = "";
if (accessToken) {
  const cookies = await context.cookies();
  cookieStr = cookies
    .filter((c) => c.domain.includes("bancolombia.com"))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

await browser.close();

if (!accessToken) {
  console.log(`\n${fail("Login timed out. Please try again.")}\n`);
  process.exit(1);
}

console.log(`${ok("Session captured!")} ${dim("Verifying...")}`);

const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

const config: DirectConfig = {
  mode: "direct",
  accessToken,
  cookies: cookieStr,
  ip,
  deviceId,
  sessionTracker,
  expiresAt,
};

await saveConfig(config);

let accounts;
try {
  accounts = await withSpinner("Loading accounts...", () => getAccounts(config));
} catch {}

printDetail("Connected to Bancolombia", [
  ["Mode", success("Direct (browser login)")],
  ["Expires", new Date(expiresAt).toLocaleString("es-CO")],
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
