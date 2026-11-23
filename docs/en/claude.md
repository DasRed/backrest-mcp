---
title: Connect to Claude
description: Add backrest-mcp as a custom connector in Claude (web, desktop, mobile) or as a remote MCP server in Claude Code, test the connection and fix common problems.
order: 30
slug: claude
section: Setup
---

## Requirements

- backrest-mcp is running and reachable from the internet via HTTPS, e.g. at `https://backrest.mcp.example.com/mcp`.
- Access is restricted (see [Security](security.md)).

> [!IMPORTANT]
> Custom connectors in Claude connect from Anthropic's servers, not from your machine. A URL that only works in your home network is not enough.

## Claude (web, desktop, mobile)

1. **Settings** → **Connectors** → **Add custom connector**.
2. Name: e.g. `Backrest`.
3. URL: `https://backrest.mcp.example.com/mcp`
4. Save.

Claude connectors cannot send custom headers, so no bearer token either. Restrict the endpoint at the reverse proxy instead, e.g. with basic auth or an access list containing [Anthropic's outbound IP addresses](https://docs.claude.com/en/api/ip-addresses).

With write mode enabled, you can set per tool in Claude's connector settings whether Claude has to ask first. That makes sense for `forget_snapshots`, `remove_repo`, `set_config`, `run_command` and `clear_history`.

## Claude Code

In Claude Code you can pass the bearer token directly:

```sh
claude mcp add --transport http backrest https://backrest.mcp.example.com/mcp \
  --header "Authorization: Bearer your-mcp-auth-token"
```

This requires `BACKREST_MCP_AUTH_TOKEN` to be set on the server.

## Test

Ask Claude for example:

- "How did my backups do in the last 30 days?"
- "Show me the last failed operation in Backrest and its log."
- "Which snapshots does the repository `nas` have from this week?"

Claude should call `get_summary_dashboard`, `get_operations`, `get_logs` or `list_snapshots` for that.

## Troubleshooting

| Symptom                                   | Cause                                                                                     |
|-------------------------------------------|-------------------------------------------------------------------------------------------|
| Connector does not connect                | Server not publicly reachable, or the proxy blocks Anthropic's IPs.                       |
| `401 Unauthorized` from the MCP server    | `BACKREST_MCP_AUTH_TOKEN` is set but the client sends no or a wrong token.                |
| `405 Method not allowed`                  | Expected for `GET`. The server is stateless and only accepts `POST`.                      |
| Tools are missing                         | `BACKREST_MCP_READ_ONLY` or the allow/deny lists filter them out.                         |
| Tool reports `unauthenticated`            | Backrest requires a login: username/password missing or wrong.                            |
| Tool reports `Backrest is not reachable`  | `BACKREST_MCP_BACKREST_URL` is wrong or the container is not in the network of Backrest.  |
| `start_backup` reports `running`          | Not an error: the backup takes longer than `wait_seconds` and keeps running in Backrest.  |

After changing the tool set, disconnect and reconnect the connector in Claude once so it loads the new tool list.
