---
title: Configuration
description: All environment variables of backrest-mcp with their defaults, plus how to set up a Backrest user and limit the available tools with read-only mode and filters.
order: 20
slug: configuration
section: Setup
---

backrest-mcp is configured entirely through environment variables. A template is in [`.env.example`](https://github.com/DasRed/backrest-mcp/blob/main/.env.example).

## Environment variables

| Name                               | Default                     | Description                                                                                                   |
|------------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------|
| `BACKREST_MCP_BACKREST_URL`        | –                           | Required. URL of Backrest as reachable from the container, e.g. `http://backrest:9898`.                       |
| `BACKREST_MCP_BACKREST_USERNAME`   | empty                       | Backrest user for HTTP basic auth. Empty: requests are sent without credentials.                              |
| `BACKREST_MCP_BACKREST_PASSWORD`   | empty                       | Password of that user. Must be set together with the username.                                                |
| `BACKREST_MCP_BACKREST_TIMEOUT`    | `60000`                     | Timeout per request to Backrest in milliseconds.                                                              |
| `BACKREST_MCP_BACKREST_PUBLIC_URL` | `BACKREST_MCP_BACKREST_URL` | Address of Backrest in download links from `get_download_url`, e.g. `https://backrest.example.com`.          |
| `BACKREST_MCP_READ_ONLY`           | `true`                      | Expose only read-only tools. Accepts `true`/`false`, `1`/`0`, `yes`/`no`, `on`/`off`.                         |
| `BACKREST_MCP_TOOLS_ALLOW`         | empty                       | Comma separated tool names to keep. `*` is a wildcard.                                                        |
| `BACKREST_MCP_TOOLS_DENY`          | empty                       | Comma separated tool names to remove. `*` is a wildcard.                                                      |
| `BACKREST_MCP_MASK_SECRETS`        | `true`                      | Replace passwords, restic environment values and hook tokens with `********` (see [Security](security.md)).    |
| `BACKREST_MCP_AUTH_TOKEN`          | empty                       | If set, `/mcp` requires the header `Authorization: Bearer <token>`.                                           |
| `BACKREST_MCP_PATH`                | `/mcp`                      | Path of the MCP endpoint.                                                                                     |
| `BACKREST_MCP_SERVER_HOST`         | `0.0.0.0`                   | Listen address.                                                                                               |
| `BACKREST_MCP_SERVER_PORT`         | `3000`                      | Listen port.                                                                                                  |
| `BACKREST_MCP_SERVER_LOG_LEVEL`    | `info`                      | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.                                               |

A missing URL, an invalid value or only one of username and password stop the server at startup with a clear error.

## With or without authentication

Backrest either runs without login (authentication disabled in the settings) or with users and passwords. backrest-mcp supports both:

| Backrest                    | `BACKREST_MCP_BACKREST_USERNAME` / `_PASSWORD` | Requests to Backrest                 |
|-----------------------------|-----------------------------------------------|--------------------------------------|
| Authentication disabled     | both empty                                    | without `Authorization` header       |
| Authentication enabled      | both set                                      | with `Authorization: Basic …`        |

If authentication is enabled in Backrest but no credentials are set, every tool reports `unauthenticated`.

## Backrest user

Create a dedicated user for the MCP server so you can change or remove its password independently:

1. In Backrest: **Settings** → **Authentication** → **Add user**.
2. Name, e.g. `claude`, and a long random password.
3. Save and use both as `BACKREST_MCP_BACKREST_USERNAME` and `BACKREST_MCP_BACKREST_PASSWORD`.

> [!IMPORTANT]
> Backrest has no roles: every user may do everything. Read-only mode is only enforced by backrest-mcp itself, not by Backrest.

## Tool filters

Filters are applied in this order:

1. **`BACKREST_MCP_READ_ONLY`** drops all write tools.
2. **`BACKREST_MCP_TOOLS_ALLOW`** keeps only matching tools (if set).
3. **`BACKREST_MCP_TOOLS_DENY`** removes matching tools.

Examples:

```sh
# Status only: dashboard, operations and logs
BACKREST_MCP_TOOLS_ALLOW=get_summary_dashboard,get_operations,get_logs

# Allow backups and maintenance, but no config changes and no restic commands
BACKREST_MCP_READ_ONLY=false
BACKREST_MCP_TOOLS_DENY=set_*,add_repo,remove_repo,run_command,clear_history

# Everything except deleting
BACKREST_MCP_READ_ONLY=false
BACKREST_MCP_TOOLS_DENY=remove_repo,forget_snapshots,clear_history
```

See [Tools](tools.md) for all available tools.

## Example

```sh
BACKREST_MCP_BACKREST_URL=http://backrest:9898
BACKREST_MCP_BACKREST_USERNAME=claude
BACKREST_MCP_BACKREST_PASSWORD=your-password
BACKREST_MCP_BACKREST_PUBLIC_URL=https://backrest.example.com
BACKREST_MCP_READ_ONLY=false
BACKREST_MCP_TOOLS_DENY=run_command,remove_repo
```
