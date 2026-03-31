#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, saveConfig, removeConfig } from "../config";
import { connectViaApi } from "../services/auth";
import { getAccounts } from "../services/account";
import { getTransactions } from "../services/transaction";
import { formatCOP, formatAccountType } from "../formatters";
import { PROXY_API_URL } from "../constants";
import type { ApiConfig } from "../schemas/config";

const server = new McpServer({
  name: "bancolombia",
  version: "0.0.1",
  description: [
    "Manage Bancolombia bank accounts. All amounts are in COP (Colombian Pesos).",
    "",
    "Flow: login → accounts → transactions → logout",
    "",
    "Sessions expire after ~6 minutes of inactivity. If you get a 401 error, the user needs to login again.",
    "",
    "IMPORTANT: Always confirm with the user before calling login (it requires bank credentials).",
  ].join("\n"),
});

// ─── Auth ───────────────────────────────────────────────────────────────────

server.tool(
  "login",
  "Connect to Bancolombia via API proxy. Requires username and 4-digit ATM PIN. Always confirm with the user before calling.",
  {
    username: z.string().describe("Bancolombia username"),
    password: z.string().describe("4-digit ATM PIN"),
    api_url: z.string().optional().default(PROXY_API_URL).describe("API proxy URL"),
  },
  async ({ username, password, api_url }) => {
    const session = await connectViaApi(username, password, api_url);
    const config: ApiConfig = {
      mode: "api",
      token: session.token,
      apiUrl: api_url,
      expiresAt: session.expiresAt,
    };
    await saveConfig(config);
    return {
      content: [{
        type: "text",
        text: `Connected to Bancolombia. Session expires at ${new Date(session.expiresAt).toLocaleString("es-CO")}. Token saved to config.`,
      }],
    };
  }
);

server.tool(
  "logout",
  "Disconnect from Bancolombia and clear the saved session",
  {},
  async () => {
    try {
      const config = await loadConfig();
      if (config.mode === "api") {
        const { disconnectViaApi } = await import("../services/auth");
        await disconnectViaApi(config);
      }
    } catch {}
    await removeConfig();
    return {
      content: [{ type: "text", text: "Disconnected from Bancolombia. Session cleared." }],
    };
  }
);

// ─── Accounts ───────────────────────────────────────────────────────────────

server.tool(
  "get_accounts",
  "List all bank accounts with balances. Returns account IDs needed for get_transactions.",
  {},
  async () => {
    const config = await loadConfig();
    const accounts = await getAccounts(config);
    const result = accounts.map((a) => ({
      id: a.id,
      type: a.type,
      type_label: formatAccountType(a.type),
      number: a.number,
      name: a.name,
      balance: a.balance,
      balance_formatted: formatCOP(a.balance),
      currency: a.currency,
    }));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_balance",
  "Quick balance check for all accounts",
  {},
  async () => {
    const config = await loadConfig();
    const accounts = await getAccounts(config);
    const summary = accounts.map(
      (a) => `${formatAccountType(a.type)} ****${a.number.slice(-4)}: ${formatCOP(a.balance)} ${a.currency}`
    );
    return {
      content: [{ type: "text", text: summary.join("\n") }],
    };
  }
);

// ─── Transactions ───────────────────────────────────────────────────────────

server.tool(
  "get_transactions",
  "Get transactions for a specific account within a date range. Use account IDs from get_accounts.",
  {
    account_id: z.string().describe("Account ID from get_accounts"),
    from: z.string().describe("Start date (YYYY-MM-DD)"),
    to: z.string().describe("End date (YYYY-MM-DD)"),
  },
  async ({ account_id, from, to }) => {
    const config = await loadConfig();
    const transactions = await getTransactions(account_id, from, to, config);

    const totalCredit = transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          transactions: transactions.map((t) => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            amount_formatted: formatCOP(t.amount),
            type: t.type,
            reference: t.reference,
          })),
          summary: {
            count: transactions.length,
            total_in: formatCOP(totalCredit),
            total_out: formatCOP(totalDebit),
            net: formatCOP(totalCredit - totalDebit),
          },
        }, null, 2),
      }],
    };
  }
);

// ─── Session Info ───────────────────────────────────────────────────────────

server.tool(
  "session_info",
  "Show current session info including mode, expiry, and connection status",
  {},
  async () => {
    const config = await loadConfig();
    const expiresAt = new Date(config.expiresAt);
    const now = new Date();
    const isExpired = expiresAt < now;
    const minutesLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / 60000));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          bank: "Bancolombia",
          mode: config.mode,
          ...(config.mode === "api" ? { api_url: config.apiUrl } : {}),
          expires_at: config.expiresAt,
          status: isExpired ? "expired" : "active",
          minutes_remaining: minutesLeft,
        }, null, 2),
      }],
    };
  }
);

// ─── Start ──────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[bancolombia-mcp] server running — 6 tools available");
