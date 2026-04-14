# Bancolombia CLI

CLI, REST API, and MCP server for managing Bancolombia bank accounts.

## Architecture

Three interfaces sharing the same service layer:

1. **CLI** (`index.ts` → `src/commands/`) — Terminal commands
2. **REST API** (`server.ts` → `src/api/app.ts`) — HTTP endpoints on port 3200
3. **MCP** (`src/mcp/index.ts`) — Claude Code integration with 6 tools

## Two login modes

- **Direct** (`bancolombia login`): Opens browser, user logs in visually, CLI intercepts OAuth2 token + Imperva cookies. Calls Bancolombia API directly. No server dependency.
- **API proxy** (`bancolombia connect`): Sends credentials to a proxy server that handles headless browser login. Requires the proxy running.

## Layers

- `src/schemas/` — Zod validation schemas
- `src/services/` — Business logic (handles both direct and proxy API calls)
- `src/commands/` — CLI commands (standalone scripts)
- `src/api/` — Hono REST API
- `src/mcp/` — MCP server for Claude
- `src/ui/` — Terminal formatting (chalk, tables, spinners)
- `src/http.ts` — Typed HTTP client (dual-mode: direct Bancolombia or proxy)
- `src/config.ts` — Config file I/O (`.bancolombia-config.json`)

## Prerequisites

- Bun runtime
- Playwright (for browser login): `bun add playwright`

## Commands

```bash
bancolombia login                          # Log in via browser (recommended)
bancolombia connect <user> <pin>           # Log in via API proxy
bancolombia accounts                       # List accounts
bancolombia balance                        # Quick balance check
bancolombia transactions <acct> <from> <to> # Transaction history
bancolombia whoami                         # Session info
bancolombia logout                         # Disconnect
bancolombia health                         # Check proxy API status
bancolombia server                         # Start REST API
bancolombia mcp                            # Start MCP server
bancolombia openclaw <user> <pin>          # Local headless login → ship session to Railway
```

## OpenClaw (remote session shipping)

`src/commands/openclaw.ts` logs in locally via headless Playwright, then ships the resulting config to a Railway service over `railway ssh`. This exists because Bancolombia's anti-bot checks require a real browser on a client device — so the server can't log in itself; it must receive a session captured elsewhere.

- Remote path is auto-discovered across candidates in `DEFAULT_REMOTE_PATHS` (npm global first, bun global fallback). First one whose parent dir exists wins; chosen path echoed over stdout and reported back.
- `OPENCLAW_SERVICE` env var overrides the service name (default `OpenClaw`).
- `OPENCLAW_CONFIG_PATH` env var forces a single path (disables fallback).
- Session lifetime on the remote side ≈ 6 min of inactivity; re-run the command to refresh.

## Conventions

- TypeScript strict mode, ESNext, Bun runtime
- Zod v4 for schemas (`import { z } from "zod/v4"`)
- Each command is a standalone script
- Services return typed data, commands format for display
- Brand colors: Bancolombia yellow `#FDDA24`, blue `#003DA5`
- All amounts in COP (Colombian Pesos)
