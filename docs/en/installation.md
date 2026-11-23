---
title: Installation
description: Run backrest-mcp as a Docker container next to Backrest with docker run or Compose, with network setup, ports, endpoints and a quick check of the connection.
order: 10
slug: installation
section: Setup
---

## Image

The image is published to the GitHub Container Registry for `linux/amd64` and `linux/arm64`:

```text
ghcr.io/dasred/backrest-mcp
```

Available tags: `latest`, `<major>` (e.g. `1`), `<major>.<minor>` and the full version. For long-running setups use the major tag.

## Requirements

- A running Backrest, version 1.14 or newer. The MCP server talks to the same port as the web UI (default `9898`).
- If authentication is enabled in Backrest: a user for the MCP server (see [Configuration](configuration.md#backrest-user)).

## Quick start

With authentication in Backrest:

```sh
docker run -d --name mcp-backrest \
  -p 3000:3000 \
  -e BACKREST_MCP_BACKREST_URL=http://backrest:9898 \
  -e BACKREST_MCP_BACKREST_USERNAME=claude \
  -e BACKREST_MCP_BACKREST_PASSWORD=your-password \
  ghcr.io/dasred/backrest-mcp:1
```

Without authentication in Backrest simply leave out username and password:

```sh
docker run -d --name mcp-backrest \
  -p 3000:3000 \
  -e BACKREST_MCP_BACKREST_URL=http://backrest:9898 \
  ghcr.io/dasred/backrest-mcp:1
```

Check that the server is running:

```sh
curl http://localhost:3000/healthz
```

Response: `{"status":"ok"}`. The health check only covers the MCP server itself, not the connection to Backrest. The startup log shows whether basic auth is used and which tools are active.

## Docker Compose

The easiest setup is to run the container in the same Docker network as Backrest. It then reaches Backrest by container name.

```yaml
services:
  mcp-backrest:
    image: ghcr.io/dasred/backrest-mcp:1
    restart: unless-stopped
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    environment:
      BACKREST_MCP_BACKREST_URL: http://backrest:9898
      BACKREST_MCP_BACKREST_USERNAME: ${BACKREST_USERNAME}
      BACKREST_MCP_BACKREST_PASSWORD: ${BACKREST_PASSWORD}
      BACKREST_MCP_READ_ONLY: 'true'
    networks:
      - backup

networks:
  backup:
    external: true
```

Put username and password into a `.env` file next to `compose.yaml`, not into the file itself.

> [!TIP]
> The server stores nothing on disk, so `read_only: true` and `cap_drop: ALL` work without any volumes.

## Ports and endpoints

| Path       | Method | Description                                                  |
|------------|--------|--------------------------------------------------------------|
| `/mcp`     | `POST` | MCP endpoint (path configurable via `BACKREST_MCP_PATH`)     |
| `/healthz` | `GET`  | Health check, no authentication                              |

The container listens on port `3000`. Methods other than `POST` on `/mcp` return `405` because the server is stateless.

## Making it reachable for Claude

Custom connectors in Claude connect from Anthropic's servers. The MCP server therefore needs a public HTTPS address, e.g. `https://backrest.mcp.example.com/mcp` through a reverse proxy like Nginx Proxy Manager. Backrest itself does not need to be public; only the MCP server has to reach it.

How to restrict access is described in [Security](security.md).
