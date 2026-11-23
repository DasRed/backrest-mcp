---
title: Überblick
description: backrest-mcp macht die API von Backrest als Remote-MCP-Server für Claude nutzbar. Was er mit deinen restic-Backups kann, wie er arbeitet und sein Status.
order: 0
section: Einstieg
---

## Was ist backrest-mcp?

backrest-mcp ist ein [MCP](https://modelcontextprotocol.io)-Server für [Backrest](https://github.com/garethgeorge/backrest), die Weboberfläche und den Planer für [restic](https://restic.net)-Backups. Er läuft als Docker-Container und spricht Streamable HTTP, du kannst ihn also als Custom Connector in Claude einbinden.

Claude sieht dann, wie es um deine Backups steht, kann Snapshots durchsuchen und Logs lesen. Wenn du es erlaubst, startet es auch Backups und Wiederherstellungen, führt Prune oder Check aus und ändert Pläne und Repositories.

## Wofür?

- **Status**: „Sind heute Nacht alle Backups gelaufen? Welcher Plan ist in den letzten 30 Tagen fehlgeschlagen?“
- **Fehlersuche**: „Warum ist das Backup von `chronos-db` fehlgeschlagen?“ – Claude liest die Operation und ihr Log.
- **Dateien finden**: „Welcher Snapshot enthält noch die `/etc/nginx/nginx.conf` von letzter Woche?“ samt Download-Link.
- **Wartung**: Backup starten, `check` oder `prune` laufen lassen, hängende Locks entfernen.
- **Konfiguration**: Pläne, Zeitpläne, Aufbewahrung und Hooks anlegen oder ändern.

## Tools

Es gibt 26 Tools, eins für jede Prozedur der Backrest-API plus die Prometheus-Metriken: Dashboard, Konfiguration, Operationen, Live-Ereignisse, Logs, Snapshots, Download-Links, Backups, Wiederherstellungen, Repository-Aufgaben, restic-Befehle, Multihost-Sync und mehr. 13 davon lesen nur.

Standardmäßig sind nur die lesenden Tools aktiv. Die vollständige Liste steht unter [Tools](tools.md).

## So funktioniert es

Backrest bietet seine API als gRPC-Dienst an, der sich auch mit JSON über HTTP aufrufen lässt ([Connect-Protokoll](https://connectrpc.com/docs/protocol)). backrest-mcp übersetzt jeden Tool-Aufruf in so eine Anfrage:

- **Anmeldung optional**: Mit Benutzername und Passwort schickt er HTTP Basic Auth mit, ohne beides ruft er Backrest ohne Zugangsdaten auf – für Installationen mit abgeschalteter Anmeldung.
- **Streams**: Live-Ereignisse, Logs und der Sync-Status sind Server-Streams; der Server liest sie eine begrenzte Zeit und gibt zurück, was bis dahin ankam.
- **Geheimnisse**: Repository-Passwörter, Werte der restic-Umgebung und Hook-Tokens werden durch `********` ersetzt, bevor sie bei Claude ankommen, und beim Zurückschreiben einer Konfiguration wieder eingesetzt.
- **Zustandslos**: Jeder `POST` auf `/mcp` bekommt eine eigene MCP-Instanz, gespeichert wird nichts.

## Status

Gebaut gegen die API von Backrest 1.14. Das Image wird bei jedem Release automatisch nach `ghcr.io/dasred/backrest-mcp` gebaut.

Backrest dokumentiert nur `Backup` und `GetOperations` als stabil. Die übrigen Prozeduren stammen aus der [Dienstdefinition](https://github.com/garethgeorge/backrest/blob/main/proto/v1/service.proto) von Backrest und können sich mit neuen Versionen ändern.

## Weiter

1. [Installation](installation.md)
2. [Konfiguration](configuration.md)
3. [In Claude einbinden](claude.md)
4. [Andere MCP-Clients](clients.md)
