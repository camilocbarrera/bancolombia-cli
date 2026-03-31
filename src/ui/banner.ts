import { join } from "path";
import { bancoYellow, dim } from "./chalk";

const LOGO_PATH = join(import.meta.dir, "logo.png");

const ASCII_FALLBACK = `
  ██████   █████  ███    ██  ██████  ██████  ██       ██████  ███    ███ ██████  ██  █████        ██████ ██      ██
  ██   ██ ██   ██ ████   ██ ██      ██    ██ ██      ██    ██ ████  ████ ██   ██ ██ ██   ██      ██      ██      ██
  ██████  ███████ ██ ██  ██ ██      ██    ██ ██      ██    ██ ██ ████ ██ ██████  ██ ███████      ██      ██      ██
  ██   ██ ██   ██ ██  ██ ██ ██      ██    ██ ██      ██    ██ ██  ██  ██ ██   ██ ██ ██   ██      ██      ██      ██
  ██████  ██   ██ ██   ████  ██████  ██████  ███████  ██████  ██      ██ ██████  ██ ██   ██       ██████ ███████ ██`;

async function renderWithChafa(): Promise<string | null> {
  try {
    const proc = Bun.spawn(["chafa", "-f", "symbols", "--size", "70x10", LOGO_PATH], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode !== 0 || !output.trim()) return null;
    return output;
  } catch {
    return null;
  }
}

export async function printBanner(version?: string) {
  const rendered = await renderWithChafa();

  if (rendered) {
    process.stdout.write(rendered);
  } else {
    console.log(bancoYellow(ASCII_FALLBACK));
  }

  if (version) console.log(`\n  ${dim(`v${version}  ·  Manage your Bancolombia accounts from the terminal`)}`);
  console.log();
}
