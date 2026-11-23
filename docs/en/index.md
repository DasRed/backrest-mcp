---
title: Overview
description: backrest-mcp exposes the Backrest API as a remote MCP server for Claude. What it can do with your restic backups, how it works and its current status.
order: 0
section: Getting started
---

## What is backrest-mcp?

backrest-mcp is an [MCP](https://modelcontextprotocol.io) server for [Backrest](https://github.com/garethgeorge/backrest), the web UI and scheduler for [restic](https://restic.net) backups. It runs as a Docker container and speaks Streamable HTTP, so you can add it to Claude as a custom connector.

Claude can then see how your backups are doing, browse snapshots and read logs. If you allow it, it can also start backups and restores, run prune or check and change plans and repositories.

## What for?

- **Status**: "Did all backups run last night? Which plan has failed in the last 30 days?"
- **Troubleshooting**: "Why did the backup of `chronos-db` fail?" – Claude reads the operation and its log.
- **Finding files**: "Which snapshot still contains `/etc/nginx/nginx.conf` from last week?" plus a download link.
- **Maintenance**: start a backup, run `check` or `prune`, remove stale locks.
- **Configuration**: create or change plans, schedules, retention and hooks.

## Tools

There are 26 tools, one for each procedure of the Backrest API plus the Prometheus metrics: dashboard, config, operations, live events, logs, snapshots, download links, backups, restores, repository tasks, restic commands, multihost sync and more. 13 of them are read-only.

By default only the read-only tools are active. See [Tools](tools.md) for the full list.

## How it works

Backrest offers its API as a gRPC service that can also be called with JSON over HTTP ([Connect protocol](https://connectrpc.com/docs/protocol)). backrest-mcp translates every tool call into such a request:

- **Authentication optional**: with username and password it sends HTTP basic auth, without them it calls Backrest without credentials – for installations where authentication is disabled.
- **Streams**: live events, logs and the sync state are server streams; the server reads them for a limited time and returns what arrived.
- **Secrets**: repository passwords, restic environment values and hook tokens are replaced with `********` before they reach Claude and are restored when a config is written back.
- **Stateless**: every `POST` to `/mcp` gets its own MCP instance, nothing is stored.

## Status

Built against the API of Backrest 1.14. The image is built automatically to `ghcr.io/dasred/backrest-mcp` on every release.

Backrest only documents `Backup` and `GetOperations` as stable. The other procedures come from the [service definition](https://github.com/garethgeorge/backrest/blob/main/proto/v1/service.proto) of Backrest and may change with new versions.

## Next

1. [Installation](installation.md)
2. [Configuration](configuration.md)
3. [Connect to Claude](claude.md)
4. [Other MCP clients](clients.md)
