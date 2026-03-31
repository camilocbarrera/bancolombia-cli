import { existsSync } from "fs";
import { join } from "path";
import { BancolombiaConfigSchema, type BancolombiaConfig } from "./schemas/config";
import { CONFIG_FILENAME } from "./constants";

const CONFIG_PATH = join(import.meta.dir, "..", CONFIG_FILENAME);

export async function loadConfig(): Promise<BancolombiaConfig> {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(
      `No config found. Run: bancolombia login to connect via browser.`
    );
  }
  const text = await Bun.file(CONFIG_PATH).text();
  const parsed = BancolombiaConfigSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Invalid config: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function saveConfig(config: BancolombiaConfig): Promise<void> {
  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function removeConfig(): Promise<void> {
  const { unlinkSync } = await import("fs");
  if (existsSync(CONFIG_PATH)) {
    unlinkSync(CONFIG_PATH);
  }
}
