<p align="center">
  <img src="assets/banner.png" alt="Bancolombia CLI" width="600">
</p>

<p align="center">
  Manage your <a href="https://www.bancolombia.com/">Bancolombia</a> accounts from the terminal, via REST API, or as an MCP server for Claude.<br>
  Built with Bun, TypeScript, Zod, and Hono.
</p>

## Install

```bash
# From npm (requires Bun)
bun add -g bancolombia-cli

# Or clone and link
git clone https://github.com/camilocbarrera/bancolombia-cli.git
cd bancolombia-cli
bun install
bun link
```

## Login

```bash
bancolombia login       # Opens browser — log in with your Bancolombia account
```

Or via API proxy (headless):

```bash
bancolombia connect <username> <pin> [api-url]
```

## CLI Usage

```bash
# Banking
bancolombia accounts                              # List all accounts
bancolombia balance                               # Quick balance check
bancolombia transactions 69870233906 2026-01-01 2026-03-31  # Transaction history

# Session
bancolombia whoami                                # Show session info
bancolombia health                                # Check API server status
bancolombia logout                                # Disconnect and clear session
```

## REST API

```bash
bancolombia server    # Starts on http://localhost:3200
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List accounts with balances |
| GET | `/api/transactions?accountId=X&from=Y&to=Z` | Transaction history |
| GET | `/api/whoami` | Session info |

## MCP Server (Claude Integration)

The Bancolombia CLI includes an MCP (Model Context Protocol) server that lets Claude manage your bank accounts natively.

### Setup for Claude Code

Add `.mcp.json` to your project root:

```json
{
  "mcpServers": {
    "bancolombia": {
      "command": "bun",
      "args": ["run", "/path/to/bancolombia-cli/src/mcp/index.ts"]
    }
  }
}
```

### Setup for Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bancolombia": {
      "command": "/path/to/.bun/bin/bun",
      "args": ["run", "/path/to/bancolombia-cli/src/mcp/index.ts"]
    }
  }
}
```

> Use the full path to `bun` for Claude Desktop (run `which bun` to find it).

### Available Tools

| Tool | Description |
|------|-------------|
| `login` | Connect to Bancolombia via API proxy |
| `logout` | Disconnect and clear session |
| `get_accounts` | List accounts with balances |
| `get_balance` | Quick balance summary |
| `get_transactions` | Transaction history with date range |
| `session_info` | Current session status and expiry |

## Architecture

```
src/
  constants.ts       → URLs, paths, defaults
  http.ts            → Typed HTTP client (direct Bancolombia + API proxy)
  config.ts          → Config load/save with Zod validation
  formatters.ts      → Currency formatting (COP)
  schemas/           → Zod schemas (config, account, transaction, bancolombia raw)
  services/          → Business logic (shared by CLI, API + MCP)
  api/app.ts         → Hono REST API
  mcp/index.ts       → MCP server (6 tools for Claude)
  commands/          → CLI commands
  ui/                → Terminal UI (chafa logo, chalk, tables, spinners)
index.ts             → CLI entry point
server.ts            → API server entry point
```

## Type Safety

All API responses are validated with [Zod](https://zod.dev/) schemas:

- **Bancolombia raw responses** → `schemas/bancolombia.ts` (accounts, transactions)
- **Normalized output** → `schemas/account.ts`, `schemas/transaction.ts`
- **Config** → discriminated union (`direct` | `api` mode)
- **Errors** → `BancolombiaError` with session expiry detection

## Security Considerations

> **This tool is designed for fully local, personal use only.** It runs entirely on your machine — no data is sent to third-party servers (except Bancolombia's own APIs). However, working with real banking credentials carries inherent risks you should understand before using it.

### Credential Storage

Session tokens, cookies, and device identifiers are stored in **plaintext** at `~/.bancolombia-config.json`. This file is not encrypted. Anyone with access to your home directory (malware, shared machine, backup sync) could read your banking session. Recommendations:

- Run `chmod 600 ~/.bancolombia-config.json` to restrict file permissions to your user only
- Always run `bancolombia logout` when you're done to clear stored credentials
- Never commit or share your config file
- Be aware the stored JWT token contains your **real name and document number**

### Shell History

The `bancolombia connect <user> <pin>` command accepts your PIN as a CLI argument, which means it gets saved in your shell history (`~/.zsh_history`, `~/.bash_history`). If you use this command, clear the entry from your history afterward. The browser-based `bancolombia login` is the safer alternative.

### REST API

The local API server (`bancolombia server`) binds to port 3200 with **no authentication and open CORS**. This is fine for personal use on localhost, but:

- Do **not** expose this port to the network or internet
- Any application on your machine can query your accounts and transactions while the server is running
- Stop the server when not in use

### MCP Server & AI Context

When using the MCP server with Claude (Code or Desktop), your account data — numbers, balances, transactions — is sent as text to the AI model. Be aware that:

- This data flows through Anthropic's API and is subject to their [data policies](https://www.anthropic.com/policies)
- Conversation context may be logged, cached, or used for safety monitoring
- Avoid using MCP if you are not comfortable with your financial data being processed by a third-party AI provider

### Browser Automation

The `bancolombia login` command launches a Chromium instance with `--no-sandbox` and automation flags disabled. This is necessary to interact with Bancolombia's website but reduces browser-level security protections during the login flow.

### General Advice

- **Use this tool at your own risk.** It is an unofficial, community project — not endorsed by Bancolombia.
- Treat your machine as the security boundary. If your machine is compromised, your banking session is compromised.
- Review the source code before use. This is why it's open source.

## Tech Stack

- [Bun](https://bun.sh) — Runtime
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Zod](https://zod.dev/) — Schema validation
- [Hono](https://hono.dev/) — REST API framework
- [Playwright](https://playwright.dev/) — Browser login automation
- [Chafa](https://hpjansson.org/chafa/) — Terminal logo rendering
- [MCP SDK](https://modelcontextprotocol.io/) — Claude integration (6 tools)
