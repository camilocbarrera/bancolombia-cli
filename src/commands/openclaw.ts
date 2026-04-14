import { saveConfig } from "../config";
import { browserLogin, BrowserLoginError, PlaywrightMissingError } from "../services/browser-login";
import { printDetail, withSpinner, ok, fail, bancoYellowBold, dim, bold, success, hint } from "../ui";

const RAILWAY_SERVICE = process.env.OPENCLAW_SERVICE || "OpenClaw";
const DEFAULT_REMOTE_PATHS = [
  "/usr/local/lib/node_modules/bancolombia-cli/.bancolombia-config.json",
  "/data/bun-global/install/global/node_modules/bancolombia-cli/.bancolombia-config.json",
];
const REMOTE_PATHS = process.env.OPENCLAW_CONFIG_PATH
  ? [process.env.OPENCLAW_CONFIG_PATH]
  : DEFAULT_REMOTE_PATHS;

const argUser = process.argv[2];
const argPin = process.argv[3];

if (!argUser || !argPin) {
  console.log(`\n${fail("Usage: bancolombia openclaw <user> <pin>")}\n`);
  console.log(`  Logs in headlessly and ships the session to the ${bold(RAILWAY_SERVICE)} Railway service.\n`);
  console.log(`  ${dim("Env overrides:")}`);
  console.log(`    ${hint("OPENCLAW_SERVICE")}       ${dim(`Railway service name (default: ${RAILWAY_SERVICE})`)}`);
  console.log(`    ${hint("OPENCLAW_CONFIG_PATH")}   ${dim(`Remote path (default tries: ${DEFAULT_REMOTE_PATHS.join(", ")})`)}\n`);
  process.exit(1);
}

const railwayPath = Bun.which("railway");
if (!railwayPath) {
  console.log(`\n${fail("Railway CLI not found in PATH")}\n`);
  console.log(`  Install it: ${hint("brew install railway")} or see ${hint("https://docs.railway.com/guides/cli")}\n`);
  process.exit(1);
}

console.log(`\n  ${bancoYellowBold("Bancolombia → OpenClaw")}`);
console.log(`  ${dim("Logging in headlessly...")}\n`);

let result;
try {
  result = await browserLogin({ user: argUser, pin: argPin });
} catch (err) {
  if (err instanceof PlaywrightMissingError) {
    console.log(`\n${fail("Playwright is not installed locally")}\n`);
    console.log(`  Install: ${hint("bun add playwright playwright-extra puppeteer-extra-plugin-stealth")}\n`);
    process.exit(1);
  }
  if (err instanceof BrowserLoginError) {
    console.log(`\n${fail(err.message)}\n`);
    process.exit(1);
  }
  console.log(`\n${fail(`Login failed: ${(err as Error).message}`)}\n`);
  process.exit(1);
}

const { config, stealth } = result;
console.log(`${ok("Session captured!")}`);

await saveConfig(config);

const configJson = JSON.stringify(config, null, 2);
const b64 = Buffer.from(configJson, "utf-8").toString("base64");
const pathsExpr = REMOTE_PATHS.map((p) => `'${p}'`).join(" ");
const remoteCmd = `for p in ${pathsExpr}; do if [ -d "$(dirname "$p")" ]; then printf '%s' '${b64}' | base64 -d > "$p" && echo "$p" && exit 0; fi; done; echo "none of the candidate directories exist: ${REMOTE_PATHS.join(", ")}" >&2; exit 2`;

let writtenPath = REMOTE_PATHS[0];

await withSpinner(`Shipping config to ${RAILWAY_SERVICE}...`, async () => {
  const proc = Bun.spawn(["railway", "ssh", "--service", RAILWAY_SERVICE, remoteCmd], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  const stdout = (await new Response(proc.stdout).text()).trim();
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`railway ssh exited ${exitCode}: ${stderr || stdout}`);
  }
  if (stdout) writtenPath = stdout.split("\n").pop()!.trim();
}).catch((err: Error) => {
  console.log(`\n${fail(err.message)}\n`);
  console.log(`  ${dim("Troubleshooting:")}`);
  console.log(`    ${hint("railway whoami")}                     ${dim("confirm you are logged in")}`);
  console.log(`    ${hint("railway status")}                     ${dim("confirm the right project is linked")}`);
  console.log(`    ${hint(`railway ssh --service ${RAILWAY_SERVICE}`)}   ${dim("confirm service is reachable")}\n`);
  process.exit(1);
});

printDetail("Shipped to OpenClaw", [
  ["Service", success(RAILWAY_SERVICE)],
  ["Remote path", writtenPath],
  ["Stealth", stealth ? success("on") : dim("off")],
  ["Expires", new Date(config.expiresAt).toLocaleString("es-CO")],
]);

console.log(`\n${ok("Done.")} ${dim("Session valid ~6 min of inactivity — re-run when it expires.")}\n`);
