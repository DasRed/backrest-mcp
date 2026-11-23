---
title: Installation
description: backrest-mcp als Docker-Container neben Backrest starten, per docker run oder Compose, mit Netzwerk, Ports, Endpunkten und einer kurzen Prüfung der Verbindung.
order: 10
slug: installation
section: Einrichtung
---

## Image

Das Image liegt in der GitHub Container Registry, für `linux/amd64` und `linux/arm64`:

```text
ghcr.io/dasred/backrest-mcp
```

Verfügbare Tags: `latest`, `<major>` (z. B. `1`), `<major>.<minor>` und die volle Version. Für dauerhafte Installationen nimmst du am besten den Major-Tag.

## Voraussetzungen

- Ein laufendes Backrest ab Version 1.14. Der MCP-Server spricht mit demselben Port wie die Weboberfläche (Standard `9898`).
- Ist in Backrest die Anmeldung aktiv: ein Benutzer für den MCP-Server (siehe [Konfiguration](configuration.md#backrest-benutzer)).

## Schnellstart

Mit Anmeldung in Backrest:

```sh
docker run -d --name mcp-backrest \
  -p 3000:3000 \
  -e BACKREST_MCP_BACKREST_URL=http://backrest:9898 \
  -e BACKREST_MCP_BACKREST_USERNAME=claude \
  -e BACKREST_MCP_BACKREST_PASSWORD=dein-passwort \
  ghcr.io/dasred/backrest-mcp:1
```

Ohne Anmeldung in Backrest lässt du Benutzername und Passwort einfach weg:

```sh
docker run -d --name mcp-backrest \
  -p 3000:3000 \
  -e BACKREST_MCP_BACKREST_URL=http://backrest:9898 \
  ghcr.io/dasred/backrest-mcp:1
```

Prüfen, ob der Server läuft:

```sh
curl http://localhost:3000/healthz
```

Antwort: `{"status":"ok"}`. Der Health-Check prüft nur den MCP-Server selbst, nicht die Verbindung zu Backrest. Im Startlog siehst du, ob Basic Auth genutzt wird und welche Tools aktiv sind.

## Docker Compose

Am einfachsten läuft der Container im selben Docker-Netzwerk wie Backrest. Dann erreicht er Backrest über den Containernamen.

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

Benutzername und Passwort gehören in eine `.env`-Datei neben der `compose.yaml`, nicht in die Datei selbst.

> [!TIP]
> Der Server speichert nichts auf der Platte, deshalb funktionieren `read_only: true` und `cap_drop: ALL` ohne Volumes.

## Ports und Endpunkte

| Pfad       | Methode | Beschreibung                                                     |
|------------|---------|------------------------------------------------------------------|
| `/mcp`     | `POST`  | MCP-Endpunkt (Pfad über `BACKREST_MCP_PATH` änderbar)            |
| `/healthz` | `GET`   | Health-Check, ohne Authentifizierung                             |

Der Container lauscht auf Port `3000`. Andere Methoden als `POST` auf `/mcp` liefern `405`, weil der Server zustandslos ist.

## Für Claude erreichbar machen

Custom Connectors in Claude verbinden sich von den Servern von Anthropic aus. Der MCP-Server braucht deshalb eine öffentliche HTTPS-Adresse, z. B. `https://backrest.mcp.example.com/mcp` über einen Reverse Proxy wie den Nginx Proxy Manager. Backrest selbst muss nicht öffentlich sein, nur der MCP-Server muss es erreichen.

Wie du den Zugriff einschränkst, steht unter [Sicherheit](security.md).
