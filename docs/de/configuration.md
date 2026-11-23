---
title: Konfiguration
description: Alle Umgebungsvariablen von backrest-mcp mit Standardwerten, dazu wie du einen Backrest-Benutzer anlegst und die Tools per Lesemodus und Filter einschränkst.
order: 20
slug: konfiguration
section: Einrichtung
---

backrest-mcp wird komplett über Umgebungsvariablen konfiguriert. Eine Vorlage liegt in [`.env.example`](https://github.com/DasRed/backrest-mcp/blob/main/.env.example).

## Umgebungsvariablen

| Name                               | Standard                    | Beschreibung                                                                                                  |
|------------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------|
| `BACKREST_MCP_BACKREST_URL`        | –                           | Pflicht. URL von Backrest, wie der Container sie erreicht, z. B. `http://backrest:9898`.                      |
| `BACKREST_MCP_BACKREST_USERNAME`   | leer                        | Backrest-Benutzer für HTTP Basic Auth. Leer: Anfragen gehen ohne Zugangsdaten raus.                           |
| `BACKREST_MCP_BACKREST_PASSWORD`   | leer                        | Passwort dieses Benutzers. Nur zusammen mit dem Benutzernamen.                                                |
| `BACKREST_MCP_BACKREST_TIMEOUT`    | `60000`                     | Timeout je Anfrage an Backrest in Millisekunden.                                                              |
| `BACKREST_MCP_BACKREST_PUBLIC_URL` | `BACKREST_MCP_BACKREST_URL` | Adresse von Backrest in Download-Links von `get_download_url`, z. B. `https://backrest.example.com`.          |
| `BACKREST_MCP_READ_ONLY`           | `true`                      | Nur lesende Tools anbieten. Erlaubt `true`/`false`, `1`/`0`, `yes`/`no`, `on`/`off`.                          |
| `BACKREST_MCP_TOOLS_ALLOW`         | leer                        | Kommagetrennte Tool-Namen, die bleiben. `*` als Platzhalter.                                                  |
| `BACKREST_MCP_TOOLS_DENY`          | leer                        | Kommagetrennte Tool-Namen, die entfernt werden. `*` als Platzhalter.                                          |
| `BACKREST_MCP_MASK_SECRETS`        | `true`                      | Passwörter, Werte der restic-Umgebung und Hook-Tokens durch `********` ersetzen (siehe [Sicherheit](security.md)). |
| `BACKREST_MCP_AUTH_TOKEN`          | leer                        | Wenn gesetzt, verlangt `/mcp` den Header `Authorization: Bearer <token>`.                                     |
| `BACKREST_MCP_PATH`                | `/mcp`                      | Pfad des MCP-Endpunkts.                                                                                       |
| `BACKREST_MCP_SERVER_HOST`         | `0.0.0.0`                   | Adresse, auf der der Server lauscht.                                                                          |
| `BACKREST_MCP_SERVER_PORT`         | `3000`                      | Port, auf dem der Server lauscht.                                                                             |
| `BACKREST_MCP_SERVER_LOG_LEVEL`    | `info`                      | `fatal`, `error`, `warn`, `info`, `debug`, `trace` oder `silent`.                                             |

Fehlt die URL, ist ein Wert ungültig oder ist nur Benutzername oder nur Passwort gesetzt, bricht der Server beim Start mit einer klaren Meldung ab.

## Mit oder ohne Anmeldung

Backrest läuft entweder ohne Anmeldung (in den Einstellungen abgeschaltet) oder mit Benutzern und Passwörtern. backrest-mcp kann beides:

| Backrest                    | `BACKREST_MCP_BACKREST_USERNAME` / `_PASSWORD` | Anfragen an Backrest                 |
|-----------------------------|-----------------------------------------------|--------------------------------------|
| Anmeldung abgeschaltet      | beide leer                                    | ohne `Authorization`-Header          |
| Anmeldung aktiv             | beide gesetzt                                 | mit `Authorization: Basic …`         |

Ist in Backrest die Anmeldung aktiv, aber keine Zugangsdaten gesetzt, meldet jedes Tool `unauthenticated`.

## Backrest-Benutzer

Leg für den MCP-Server einen eigenen Benutzer an, dann kannst du sein Passwort unabhängig ändern oder ihn entfernen:

1. In Backrest: **Settings** → **Authentication** → **Add user**.
2. Name, z. B. `claude`, und ein langes Zufallspasswort.
3. Speichern und beides als `BACKREST_MCP_BACKREST_USERNAME` und `BACKREST_MCP_BACKREST_PASSWORD` eintragen.

> [!IMPORTANT]
> Backrest kennt keine Rollen: Jeder Benutzer darf alles. Den Nur-Lese-Modus setzt allein backrest-mcp durch, nicht Backrest.

## Tool-Filter

Die Filter greifen in dieser Reihenfolge:

1. **`BACKREST_MCP_READ_ONLY`** entfernt alle schreibenden Tools.
2. **`BACKREST_MCP_TOOLS_ALLOW`** behält nur passende Tools (falls gesetzt).
3. **`BACKREST_MCP_TOOLS_DENY`** entfernt passende Tools.

Beispiele:

```sh
# Nur Status: Dashboard, Operationen und Logs
BACKREST_MCP_TOOLS_ALLOW=get_summary_dashboard,get_operations,get_logs

# Backups und Wartung erlaubt, aber keine Konfigurationsänderungen und keine restic-Befehle
BACKREST_MCP_READ_ONLY=false
BACKREST_MCP_TOOLS_DENY=set_*,add_repo,remove_repo,run_command,clear_history

# Alles außer Löschen
BACKREST_MCP_READ_ONLY=false
BACKREST_MCP_TOOLS_DENY=remove_repo,forget_snapshots,clear_history
```

Alle verfügbaren Tools stehen unter [Tools](tools.md).

## Beispiel

```sh
BACKREST_MCP_BACKREST_URL=http://backrest:9898
BACKREST_MCP_BACKREST_USERNAME=claude
BACKREST_MCP_BACKREST_PASSWORD=dein-passwort
BACKREST_MCP_BACKREST_PUBLIC_URL=https://backrest.example.com
BACKREST_MCP_READ_ONLY=false
BACKREST_MCP_TOOLS_DENY=run_command,remove_repo
```
