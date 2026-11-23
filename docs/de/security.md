---
title: Sicherheit
description: Was backrest-mcp mit deinen Backups darf, wie Nur-Lese-Modus und das Maskieren von Geheimnissen funktionieren und wie du Endpunkt und Zugangsdaten absicherst.
order: 50
slug: sicherheit
section: Referenz
---

## Standard: nur lesen

Ohne weitere Einstellungen bietet der Server nur die 13 lesenden Tools an. Claude kann Dashboard, Konfiguration, Operationen, Logs und Snapshots lesen, aber nichts starten, löschen oder ändern.

> [!IMPORTANT]
> Backrest kennt keine Benutzer, die nur lesen dürfen. Die Grenze setzt allein backrest-mcp durch. Wer die Umgebungsvariablen des Containers ändern kann, kann auch den Schreibmodus einschalten.

## Schreibmodus

Mit `BACKREST_MCP_READ_ONLY=false` kann Claude unter anderem:

- Backups und Wiederherstellungen starten und Operationen abbrechen
- Snapshots vergessen und Prune ausführen, also Backup-Daten endgültig löschen
- mit `run_command` beliebige restic-Befehle ausführen
- die komplette Konfiguration ersetzen, Repositories anlegen oder entfernen

> [!CAUTION]
> Wer diesen Endpunkt im Schreibmodus kontrolliert, kontrolliert deine Backups. Eine falsche Aufbewahrungsregel oder ein `forget` löscht genau das Backup, das du später brauchst. Grenz den Schreibmodus mit `BACKREST_MCP_TOOLS_DENY` ein und lass Claude vor kritischen Tools nachfragen.

Die Tools tragen MCP-Hinweise: `readOnlyHint` für lesende Tools und `destructiveHint` für Tools, die Daten überschreiben oder löschen (`set_config`, `add_repo`, `remove_repo`, `forget_snapshots`, `run_repo_task`, `run_command`, `clear_history`, `set_remote_client_config`). Claude fragt dann vor riskanten Aktionen nach.

## Geheimnisse in der Konfiguration

Die Konfiguration von Backrest enthält die Repository-Passwörter im Klartext, dazu Zugangsschlüssel in der restic-Umgebung (`env`) und Tokens in Hooks. Standardmäßig (`BACKREST_MCP_MASK_SECRETS=true`) kommen sie nie bei Claude an:

| Wert                                                               | Maskiert als               |
|--------------------------------------------------------------------|----------------------------|
| `repos[].password`                                                 | `********`                 |
| `repos[].env[]`                                                    | `KEY=********`             |
| Hook-Tokens und Webhook-URLs (Gotify, Telegram, Discord, Slack, Shoutrrr, Healthchecks, Webhook) | `********` |
| Pairing-Geheimnisse des Multihost-Sync                             | `********`                 |
| Passwort-Hashes der Benutzer                                       | `********` (macht Backrest selbst) |

Das gilt für `get_config`, für die Konfigurationen, die `set_config`, `add_repo` und `remove_repo` zurückgeben, und für die entfernten Konfigurationen in `get_peer_sync_states`.

Gibt Claude eine Konfiguration mit `set_config` oder `add_repo` zurück, ersetzt der Server jedes `********` durch den gespeicherten Wert: Repositories und Pläne über ihre ID, Umgebungsvariablen über ihren Namen, Hooks über ihre Position. Gibt es keinen gespeicherten Wert, schlägt der Aufruf fehl, statt `********` als Passwort zu speichern.

Befehle in Hooks (`actionCommand`) und die Ausgaben von `run_command` und `get_logs` werden nicht maskiert.

## Zugangsdaten

- Nimm für den MCP-Server einen eigenen Backrest-Benutzer.
- Benutzername und Passwort bleiben im Container. Sie gehen nur an `BACKREST_MCP_BACKREST_URL`, nie an Claude.
- Backrest prüft Basic Auth bei jeder Anfrage mit bcrypt. Das kostet etwas CPU, dafür muss kein Token gespeichert werden.
- Ohne Benutzername und Passwort schickt der Server keine Zugangsdaten mit – das passt nur, wenn Backrest ausschließlich aus einem vertrauenswürdigen Netz erreichbar ist.

## Download-Links

`get_download_url` erzeugt Links, die **ohne Anmeldung** funktionieren und Zugriff auf Dateien aus deinen Backups geben. Gib sie nur an Leute weiter, die die Daten sehen dürfen. Brauchst du sie nicht, entfernst du das Tool mit `BACKREST_MCP_TOOLS_DENY=get_download_url`.

## Endpunkt absichern

Wer `/mcp` erreicht, kann alle aktiven Tools aufrufen. Lass den Endpunkt nie offen im Internet.

| Möglichkeit                             | Passt für                     | So geht's                                                    |
|-----------------------------------------|-------------------------------|--------------------------------------------------------------|
| Basic Auth oder Access List am Proxy    | Claude (Web, Desktop, Mobile) | Z. B. nur die [IPs von Anthropic](https://docs.claude.com/en/api/ip-addresses) zulassen. |
| Bearer-Token (`BACKREST_MCP_AUTH_TOKEN`) | Claude Code, eigene Clients  | Langer Zufallswert, z. B. `openssl rand -hex 32`.            |
| Nur intern                              | Clients im selben Netz        | Keinen Port veröffentlichen, nur im Docker-Netz erreichbar.  |

Der Token-Vergleich läuft in konstanter Zeit. `/healthz` ist absichtlich ohne Anmeldung erreichbar und liefert nur `{"status":"ok"}`.

## Container

- Der Server ist zustandslos und schreibt nichts auf die Platte. Du kannst ihn mit `read_only: true`, `cap_drop: ALL` und `no-new-privileges` betreiben. Er läuft als Benutzer `node`.
- Anfragen an `/mcp` sind auf 4 MB begrenzt.
- Geheimnisse gehören in eine `.env`-Datei oder einen Secret Store, nicht in eine `compose.yaml` im Git.
