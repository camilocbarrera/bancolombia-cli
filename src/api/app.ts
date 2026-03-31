import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadConfig } from "../config";
import { getAccounts } from "../services/account";
import { getTransactions } from "../services/transaction";
import type { BancolombiaConfig } from "../schemas/config";

type Variables = { config: BancolombiaConfig };

const app = new Hono<{ Variables: Variables }>();

app.use("*", cors());

app.use("/api/*", async (c, next) => {
  const config = await loadConfig();
  c.set("config", config);
  await next();
});

// --- Accounts ---

app.get("/api/accounts", async (c) => {
  const config = c.get("config");
  return c.json(await getAccounts(config));
});

// --- Transactions ---

app.get("/api/transactions", async (c) => {
  const config = c.get("config");
  const accountId = c.req.query("accountId");
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!accountId || !from || !to) {
    return c.json({ error: "Missing required query params: accountId, from, to" }, 400);
  }
  return c.json(await getTransactions(accountId, from, to, config));
});

// --- Session ---

app.get("/api/whoami", async (c) => {
  const config = c.get("config");
  const expiresAt = new Date(config.expiresAt);
  const now = new Date();
  return c.json({
    bank: "Bancolombia",
    mode: config.mode,
    expired: expiresAt < now,
    expiresAt: config.expiresAt,
  });
});

export default app;
