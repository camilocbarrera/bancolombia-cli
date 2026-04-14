import { LOGIN_URL, SESSION_TTL_MS } from "../constants";
import type { DirectConfig } from "../schemas/config";

type ChromiumLike = typeof import("playwright").chromium;

export type BrowserLoginOptions = {
  user?: string;
  pin?: string;
};

export type BrowserLoginResult = {
  config: DirectConfig;
  stealth: boolean;
  automated: boolean;
};

export class BrowserLoginError extends Error {}
export class PlaywrightMissingError extends Error {}

async function loadChromium(): Promise<{ chromium: ChromiumLike; stealth: boolean }> {
  try {
    const extra = await import("playwright-extra");
    const stealth = (await import("puppeteer-extra-plugin-stealth")).default;
    (extra.chromium as any).use(stealth());
    return { chromium: extra.chromium as unknown as ChromiumLike, stealth: true };
  } catch {}
  try {
    const { chromium } = await import("playwright");
    return { chromium, stealth: false };
  } catch {
    throw new PlaywrightMissingError("Playwright is not installed");
  }
}

export async function browserLogin(options: BrowserLoginOptions = {}): Promise<BrowserLoginResult> {
  const { user, pin } = options;
  const automated = Boolean(user && pin);

  const { chromium, stealth } = await loadChromium();

  const browser = await chromium.launch({
    headless: automated,
    channel: "chrome",
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
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

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });

    if (automated) {
      await page.waitForSelector("input#username", { timeout: 30_000 });
      await page.click("input#username");
      await page.type("input#username", user!, { delay: 50 });
      await page.click("input#password");
      await page.type("input#password", pin!, { delay: 70 });
      await page.waitForTimeout(300);
      await page.click("bc-card-authentication button.bc-button-primary", { force: true });
      await page.waitForResponse(
        (res) => res.url().includes("oauth2/token") && res.status() === 200,
        { timeout: 30_000 }
      );
      await page.waitForTimeout(2000);
    } else {
      const timeout = 5 * 60 * 1000;
      const start = Date.now();
      while (!accessToken && Date.now() - start < timeout) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    let cookieStr = "";
    if (accessToken) {
      const cookies = await context.cookies();
      cookieStr = cookies
        .filter((c) => c.domain.includes("bancolombia.com"))
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
    }

    if (!accessToken) throw new BrowserLoginError("Login timed out");

    const config: DirectConfig = {
      mode: "direct",
      accessToken,
      cookies: cookieStr,
      ip,
      deviceId,
      sessionTracker,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    return { config, stealth, automated };
  } finally {
    await browser.close();
  }
}
