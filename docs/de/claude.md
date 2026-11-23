---
title: In Claude einbinden
description: backrest-mcp als Custom Connector, in Claude Code oder per JSON in anderen MCP-Clients in Claude einbinden, mit Verbindungstest und Fehlersuche.
order: 30
slug: claude
section: Einrichtung
---

## Voraussetzungen

- backrest-mcp läuft und ist per HTTPS aus dem Internet erreichbar, z. B. unter `https://backrest.mcp.example.com/mcp`.
- Der Zugriff ist eingeschränkt (siehe [Sicherheit](security.md)).

> [!IMPORTANT]
> Custom Connectors in Claude verbinden sich von den Servern von Anthropic aus, nicht von deinem Rechner. Eine URL, die nur in deinem Heimnetz funktioniert, reicht nicht.

## Claude (Web, Desktop, Mobile)

1. **Einstellungen** → **Connectors** → **Custom Connector hinzufügen**.
2. Name: z. B. `Backrest`.
3. URL: `https://backrest.mcp.example.com/mcp`
4. Speichern.

Connectors in Claude können keine eigenen Header schicken, also auch keinen Bearer-Token. Schränk den Endpunkt stattdessen am Reverse Proxy ein, z. B. mit Basic Auth oder einer Access List mit den [ausgehenden IP-Adressen von Anthropic](https://docs.claude.com/en/api/ip-addresses).

Mit aktivem Schreibmodus kannst du in den Connector-Einstellungen von Claude je Tool festlegen, ob Claude vorher fragen muss. Sinnvoll für `forget_snapshots`, `remove_repo`, `set_config`, `run_command` und `clear_history`.

## Claude Code

In Claude Code kannst du den Bearer-Token direkt mitgeben:

```sh
claude mcp add --transport http backrest https://backrest.mcp.example.com/mcp \
  --header "Authorization: Bearer dein-mcp-auth-token"
```

Dafür muss auf dem Server `BACKREST_MCP_AUTH_TOKEN` gesetzt sein.

## Andere MCP-Clients (JSON-Konfiguration)

Viele MCP-Clients werden über einen JSON-Eintrag unter `mcpServers` konfiguriert, z. B. die `.mcp.json` von Claude Code oder Clients mit eigener Weboberfläche. Für backrest-mcp sieht der Eintrag so aus:

```json
{
  "mcpServers": {
    "backrest": {
      "type": "http",
      "url": "https://backrest.mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer dein-mcp-auth-token"
      }
    }
  }
}
```

- `type` heißt je nach Client `http` oder `streamable-http`.
- `headers` lässt du weg, wenn `BACKREST_MCP_AUTH_TOKEN` auf dem Server nicht gesetzt ist.
- Solche Clients verbinden sich von deinem Rechner aus. Hier reicht deshalb auch eine Adresse im Heimnetz, z. B. `http://192.168.1.10:3000/mcp`.

Clients, die nur lokale Server per stdio starten (z. B. die `claude_desktop_config.json` von Claude Desktop), bindest du über [mcp-remote](https://www.npmjs.com/package/mcp-remote) an:

```json
{
  "mcpServers": {
    "backrest": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://backrest.mcp.example.com/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer dein-mcp-auth-token"
      }
    }
  }
}
```

Der Token steht in `env`, weil manche Clients Leerzeichen in `args` nicht sauber übergeben. Für eine `http://`-Adresse außerhalb von `localhost` braucht mcp-remote zusätzlich `--allow-http`.

## Testen

Frag Claude zum Beispiel:

- „Wie liefen meine Backups in den letzten 30 Tagen?“
- „Zeig mir die letzte fehlgeschlagene Operation in Backrest und ihr Log.“
- „Welche Snapshots hat das Repository `nas` aus dieser Woche?“

Claude sollte dafür `get_summary_dashboard`, `get_operations`, `get_logs` oder `list_snapshots` aufrufen.

## Fehlersuche

| Symptom                                   | Ursache                                                                                   |
|-------------------------------------------|-------------------------------------------------------------------------------------------|
| Connector verbindet nicht                 | Server nicht öffentlich erreichbar oder der Proxy sperrt die IPs von Anthropic.           |
| `401 Unauthorized` vom MCP-Server         | `BACKREST_MCP_AUTH_TOKEN` ist gesetzt, der Client schickt keinen oder einen falschen Token. |
| `405 Method not allowed`                  | Normal bei `GET`. Der Server ist zustandslos und nimmt nur `POST` an.                     |
| Tools fehlen                              | `BACKREST_MCP_READ_ONLY` oder die Allow-/Deny-Listen filtern sie heraus.                  |
| Tool meldet `unauthenticated`             | Backrest verlangt eine Anmeldung: Benutzername/Passwort fehlen oder sind falsch.          |
| Tool meldet `Backrest is not reachable`   | `BACKREST_MCP_BACKREST_URL` stimmt nicht oder der Container ist nicht im Netz von Backrest. |
| `start_backup` meldet `running`           | Kein Fehler: Das Backup dauert länger als `wait_seconds` und läuft in Backrest weiter.    |

Nach einer Änderung der Tools trennst du den Connector in Claude einmal und verbindest ihn neu, damit er die neue Tool-Liste lädt.
