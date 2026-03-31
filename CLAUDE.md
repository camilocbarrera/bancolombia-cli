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
```

## Conventions

- TypeScript strict mode, ESNext, Bun runtime
- Zod v4 for schemas (`import { z } from "zod/v4"`)
- Each command is a standalone script
- Services return typed data, commands format for display
- Brand colors: Bancolombia yellow `#FDDA24`, blue `#003DA5`
- All amounts in COP (Colombian Pesos)
