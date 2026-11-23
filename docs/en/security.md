---
title: Security
description: What backrest-mcp may do with your backups, how read-only mode and secret masking work and how to protect the endpoint and the Backrest credentials.
order: 50
slug: security
section: Reference
---

## Default: read-only

Without further settings the server only exposes the 13 read-only tools. Claude can read the dashboard, config, operations, logs and snapshots, but cannot start, delete or change anything.

> [!IMPORTANT]
> Backrest has no read-only users. The limit is enforced only by backrest-mcp. Anyone who can change the environment variables of the container can enable write mode.

## Write mode

With `BACKREST_MCP_READ_ONLY=false` Claude can among other things:

- start backups and restores and cancel operations
- forget snapshots and run prune, i.e. irrevocably delete backup data
- run any restic command with `run_command`
- replace the complete config, add or remove repositories

> [!CAUTION]
> Whoever controls this endpoint in write mode controls your backups. A wrong retention policy or a `forget` can delete exactly the backup you need later. Narrow write mode down with `BACKREST_MCP_TOOLS_DENY` and let Claude ask before critical tools.

Tools carry MCP hints: `readOnlyHint` for read tools and `destructiveHint` for tools that overwrite or delete data (`set_config`, `add_repo`, `remove_repo`, `forget_snapshots`, `run_repo_task`, `run_command`, `clear_history`, `set_remote_client_config`). Claude uses them to ask before risky actions.

## Secrets in the config

The config of Backrest contains repository passwords in plain text, plus access keys in the restic environment (`env`) and tokens in hooks. By default (`BACKREST_MCP_MASK_SECRETS=true`) they never reach Claude:

| Value                                                              | Masked as                  |
|--------------------------------------------------------------------|----------------------------|
| `repos[].password`                                                 | `********`                 |
| `repos[].env[]`                                                    | `KEY=********`             |
| Hook tokens and webhook URLs (Gotify, Telegram, Discord, Slack, Shoutrrr, Healthchecks, Webhook) | `********` |
| Pairing secrets of multihost sync                                  | `********`                 |
| Password hashes of users                                           | `********` (Backrest itself) |

This applies to `get_config`, to the configs returned by `set_config`, `add_repo` and `remove_repo`, and to the remote configs of `get_peer_sync_states`.

When Claude passes a config back with `set_config` or `add_repo`, the server replaces every `********` with the stored value: repositories and plans are matched by ID, environment variables by name and hooks by position. If there is no stored value, the call fails instead of saving `********` as a password.

Commands in hooks (`actionCommand`) and the output of `run_command` and `get_logs` are not masked.

## Credentials

- Use a dedicated Backrest user for the MCP server.
- Username and password stay in the container. They are only sent to `BACKREST_MCP_BACKREST_URL`, never to Claude.
- Backrest checks basic auth with bcrypt on every request. That costs a little CPU, but no token has to be stored.
- Without username and password the server sends no credentials – only suitable if Backrest is reachable solely from a trusted network.

## Download links

`get_download_url` creates links that work **without login** and give access to files of your backups. Hand them only to people who may see the data. If you do not need them, remove the tool with `BACKREST_MCP_TOOLS_DENY=get_download_url`.

## Protecting the endpoint

Anyone who can reach `/mcp` can call all active tools. Never leave the endpoint open on the internet.

| Option                                 | Suitable for                  | How                                                          |
|----------------------------------------|-------------------------------|--------------------------------------------------------------|
| Basic auth or access list at the proxy | Claude (web, desktop, mobile) | E.g. allow only [Anthropic's IPs](https://docs.claude.com/en/api/ip-addresses). |
| Bearer token (`BACKREST_MCP_AUTH_TOKEN`) | Claude Code, own clients    | Long random value, e.g. `openssl rand -hex 32`.              |
| Internal only                          | Clients in the same network   | Publish no port, reachable only inside the Docker network.   |

The token comparison is constant-time. `/healthz` is intentionally unauthenticated and only returns `{"status":"ok"}`.

## Container

- The server is stateless and writes nothing to disk. You can run it with `read_only: true`, `cap_drop: ALL` and `no-new-privileges`. It runs as user `node`.
- Requests to `/mcp` are limited to 4 MB.
- Secrets belong in a `.env` file or a secret store, not in a `compose.yaml` committed to Git.
