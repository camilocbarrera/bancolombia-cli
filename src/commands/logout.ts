import { loadConfig, removeConfig } from "../config";
import { disconnectViaApi } from "../services/auth";
import { withSpinner, ok, fail } from "../ui";

try {
  const config = await loadConfig();
  if (config.mode === "api") {
    await withSpinner("Disconnecting...", () => disconnectViaApi(config));
  }
  await removeConfig();
  console.log(`\n${ok("Disconnected. Session cleared and config removed.")}\n`);
} catch (err: any) {
  await removeConfig();
  console.log(`\n${ok("Local config removed.")}`);
  console.log(`  ${fail(err.message)}\n`);
}
