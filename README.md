# backrest-mcp

Streamable HTTP [MCP](https://modelcontextprotocol.io) server for [Backrest](https://github.com/garethgeorge/backrest), the web UI and orchestrator for [restic](https://restic.net) backups, shipped as a Docker image. It lets Claude check the state of your backups, browse snapshots and logs and – if enabled – start backups, restores, prune or check and change the configuration. Every procedure of the Backrest API a client can use is available as a tool, 26 in total including the Prometheus metrics.

Read-only by default, works with and without Backrest authentication, masks repository passwords and hook tokens, optional bearer token for the MCP endpoint.

Documentation: https://www.marco-starker.de/en/projects/backrest-mcp/docs
(Deutsch: https://www.marco-starker.de/de/projekte/backrest-mcp/doku)

## Quick start

```sh
docker run -d --name mcp-backrest \
  -p 3000:3000 \
  -e BACKREST_MCP_BACKREST_URL=http://backrest:9898 \
  -e BACKREST_MCP_BACKREST_USERNAME=claude \
  -e BACKREST_MCP_BACKREST_PASSWORD=your-password \
  ghcr.io/dasred/backrest-mcp:1
```

Leave out username and password if authentication is disabled in Backrest. The MCP endpoint is `http://localhost:3000/mcp`. Never expose it to the internet without TLS and access control.

## Local development

Requires Node.js 26 and npm 11.

```sh
npm ci
cp .env.example .env
npm run dev
npm test
npm run build
```

Releases are created by semantic-release from Conventional Commits on `main`.

## License
[MIT](LICENSE)
