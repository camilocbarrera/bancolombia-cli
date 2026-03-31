# Changelog

## 0.0.1

### Features

- **Browser login**: Opens Chrome to Bancolombia's login page — user authenticates visually, CLI intercepts OAuth2 token + Imperva cookies automatically.
- **Direct API calls**: After login, CLI talks directly to Bancolombia's API — no proxy server needed.
- **API proxy fallback**: `connect` command for headless login via API proxy server.
- **Accounts**: List all bank accounts with balances, types, and currency.
- **Balance**: Quick balance check across all accounts.
- **Transactions**: View transaction history with date range, credit/debit breakdown, and summary totals.
- **Session management**: `whoami` shows session status and expiry, `logout` clears everything.
- **Health check**: Verify API proxy server availability.
- **REST API**: Hono server on port 3200 exposing accounts and transactions endpoints.
- **MCP server**: 6 tools for Claude integration (login, logout, get_accounts, get_balance, get_transactions, session_info).
- **Chafa banner**: Bancolombia logo rendered as terminal art with brand colors (falls back to ASCII if chafa not installed).
- **Zod type safety**: All API responses validated with schemas — Bancolombia raw responses and normalized output.
- **Error handling**: `BancolombiaError` with session expiry detection, clean error messages instead of stack traces.
- **Dual-mode config**: Discriminated union supporting both direct (browser login) and API proxy sessions.

### Tech Stack

- Bun, TypeScript, Zod v4, Hono, Playwright, Chalk, ora, cli-table3, MCP SDK.
