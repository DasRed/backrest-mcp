---
title: Tools
description: Referenz aller 26 Tools von backrest-mcp für Dashboard, Operationen, Logs, Snapshots, Backups, Restores, Repository-Aufgaben, Konfiguration und Sync.
order: 40
slug: tools
section: Referenz
---

## Übersicht

| Tool                       | Art       | Backrest-Prozedur                   | Zweck                                                |
|----------------------------|-----------|-------------------------------------|------------------------------------------------------|
| `get_summary_dashboard`    | 📖 Lesen  | `GetSummaryDashboard`               | Status aller Pläne: letztes Backup, Fehler, überfällig |
| `get_config`               | 📖 Lesen  | `GetConfig`                         | Repositories, Pläne, Hooks, Benutzer                 |
| `get_operations`           | 📖 Lesen  | `GetOperations`                     | Verlauf der Operationen mit Status und Fehlern       |
| `watch_operation_events`   | 📖 Lesen  | `GetOperationEvents` (Stream)       | Laufende Operationen live verfolgen                  |
| `get_logs`                 | 📖 Lesen  | `GetLogs` (Stream)                  | Log oder Ausgabe einer Operation                     |
| `list_snapshots`           | 📖 Lesen  | `ListSnapshots`                     | Snapshots eines Repositorys oder Plans               |
| `list_snapshot_files`      | 📖 Lesen  | `ListSnapshotFiles`                 | Verzeichnis in einem Snapshot durchsuchen            |
| `get_download_url`         | 📖 Lesen  | `GetDownloadURL`                    | Download-Link für Dateien aus Snapshot oder Restore  |
| `check_repo_exists`        | 📖 Lesen  | `CheckRepoExists`                   | Repository-URI und Passwort prüfen                   |
| `path_autocomplete`        | 📖 Lesen  | `PathAutocomplete`                  | Verzeichnis auf dem Backrest-Host auflisten          |
| `get_peer_sync_states`     | 📖 Lesen  | `GetPeerSyncStatesStream` (Stream)  | Zustand der Multihost-Sync-Partner                   |
| `get_metrics`              | 📖 Lesen  | `/metrics`                          | Prometheus-Metriken                                  |
| `hash_password`            | 📖 Lesen  | `Authentication/HashPassword`       | bcrypt-Hash für einen neuen Backrest-Benutzer        |
| `start_backup`             | ✏️ Schreiben | `Backup`                         | Backup eines Plans starten                           |
| `cancel_operation`         | ✏️ Schreiben | `Cancel`                         | Laufende Operation abbrechen                         |
| `run_repo_task`            | ⚠️ Destruktiv | `DoRepoTask`                    | check, prune, forget, stats, index, unlock           |
| `forget_snapshots`         | ⚠️ Destruktiv | `Forget`                        | Snapshots per Regel oder einzeln vergessen           |
| `restore_snapshot`         | ✏️ Schreiben | `Restore`                        | In ein neues Verzeichnis auf dem Host wiederherstellen |
| `run_command`              | ⚠️ Destruktiv | `RunCommand`                    | Beliebigen restic-Befehl ausführen                   |
| `clear_history`            | ⚠️ Destruktiv | `ClearHistory`                  | Einträge aus dem Verlauf löschen                     |
| `set_config`               | ⚠️ Destruktiv | `SetConfig`                     | Komplette Konfiguration ersetzen                     |
| `add_repo`                 | ⚠️ Destruktiv | `AddRepo`                       | Repository anlegen oder ändern                       |
| `remove_repo`              | ⚠️ Destruktiv | `RemoveRepo`                    | Repository aus Backrest entfernen                    |
| `setup_sftp`               | ✏️ Schreiben | `SetupSftp`                      | SSH-Schlüssel für ein SFTP-Repository erzeugen       |
| `generate_pairing_token`   | ✏️ Schreiben | `GeneratePairingToken`           | Pairing-Token für Multihost-Sync                     |
| `set_remote_client_config` | ⚠️ Destruktiv | `BackrestSyncStateService`      | Pläne und Repositories an einen Partner schicken     |

⚠️ steht für Tools mit `destructiveHint`: Sie überschreiben oder löschen Daten. Im Standardmodus (`BACKREST_MCP_READ_ONLY=true`) sind nur die 📖-Tools verfügbar.

Nicht als Tool verfügbar: `Authentication/Login` (der Server meldet sich selbst mit den konfigurierten Zugangsdaten an) und `BackrestSyncService/Sync`, das Protokoll zwischen zwei Backrest-Instanzen.

> [!NOTE]
> IDs von Operationen und andere int64-Werte sind Strings, Zeiten sind Unix-Millisekunden. Repositories und Pläne sprichst du über die IDs aus `get_config` an.

## Status und Verlauf

### `get_summary_dashboard`

Das Dashboard von Backrest, je Plan und Repository. Standardmäßig in kompakter Form:

| Feld                                                    | Beschreibung                                                   |
|---------------------------------------------------------|----------------------------------------------------------------|
| `backupsSuccessLast30days`, `backupsFailedLast30days`, `backupsWarningLast30days` | Backups der letzten 30 Tage nach Ergebnis |
| `bytesScannedLast30days`, `bytesAddedLast30days`        | Gelesene und neue Bytes der letzten 30 Tage                    |
| `protectedBytes`                                        | Größe der Daten, die das letzte gute Backup abdeckt            |
| `lastBackup`, `lastFailure`                             | Zeit, Status, Dauer, neue Bytes und Flow-ID des letzten Backups und des letzten, das nicht erfolgreich war, sonst `null` |
| `overdue`                                               | Das letzte gute Backup ist älter, als der Zeitplan erlaubt     |
| `nextBackupTimeMs`                                      | Nächstes geplantes Backup, `null` ohne Zeitplan                |

| Parameter         | Standard | Beschreibung                                                                          |
|-------------------|----------|---------------------------------------------------------------------------------------|
| `plan_id`         | –        | Nur dieser Plan; ohne `repo_id` kommen keine Repositories                             |
| `repo_id`         | –        | Nur dieses Repository; ohne `plan_id` kommen keine Pläne                              |
| `include_history` | `false`  | Stattdessen das rohe Dashboard von Backrest mit Backup-Verläufen und Tageshistorie    |

> [!TIP]
> Das rohe Dashboard ist groß – mehrere 100 KB bei ein paar Dutzend Plänen. Nimm `include_history` nur zusammen mit `plan_id` oder `repo_id`.

### `get_config`

Die komplette Konfiguration: Instanzname, Repositories, Pläne mit Zeitplan, Aufbewahrung und Hooks, Benutzer (Passwort-Hashes immer `********`) und Multihost-Einstellungen. Parameter: keine.

### `get_operations`

Der Verlauf der Operationen, älteste zuerst.

| Parameter       | Standard | Beschreibung                                                   |
|-----------------|----------|----------------------------------------------------------------|
| `plan_id`       | –        | Nur Operationen dieses Plans                                   |
| `repo_id`       | –        | Nur Operationen dieses Repositorys (wird in die GUID übersetzt) |
| `snapshot_id`   | –        | Nur Operationen dieses Snapshots                               |
| `flow_id`       | –        | Nur Operationen eines Durchlaufs, z. B. Backup samt Hooks      |
| `instance_id`   | –        | Nur Operationen dieser Backrest-Instanz                        |
| `operation_ids` | –        | Genau diese Operationen, nicht mit den anderen kombinierbar    |
| `last_n`        | `50`     | Nur die letzten n Operationen, `0` für alle                    |

Jede Operation hat `status` (`STATUS_SUCCESS`, `STATUS_ERROR`, `STATUS_WARNING`, `STATUS_INPROGRESS` …), `unixTimeStartMs`, `unixTimeEndMs`, `displayMessage` (meist der Fehler) und einen Block für ihre Art, z. B. `operationBackup` mit Fortschritt und Fehlern.

### `watch_operation_events`

Hört eine Weile auf den Live-Stream von Backrest und gibt alle in der Zeit angelegten, geänderten und gelöschten Operationen zurück. Keep-Alive-Nachrichten werden herausgefiltert.

| Parameter          | Standard | Beschreibung             |
|--------------------|----------|--------------------------|
| `duration_seconds` | `30`     | 1 bis 300 Sekunden       |

### `get_logs`

Log oder Ausgabe einer Operation. Lange Logs werden vorne gekürzt, weil Fehler meist am Ende stehen.

| Parameter      | Standard | Beschreibung                                          |
|----------------|----------|-------------------------------------------------------|
| `operation_id` | –        | Operation, deren Log du willst                        |
| `ref`          | –        | Alternativ die Log-Referenz (`logref`, `outputLogref`) |
| `max_bytes`    | `100000` | Maximale Größe des zurückgegebenen Logs               |

### `get_metrics`

Die Prometheus-Metriken von Backrest als Text.

| Parameter | Standard | Beschreibung                                            |
|-----------|----------|---------------------------------------------------------|
| `filter`  | –        | Nur Zeilen mit diesem Text, z. B. `backrest_backup`     |

## Snapshots

### `list_snapshots`

| Parameter | Standard | Beschreibung                             |
|-----------|----------|------------------------------------------|
| `repo_id` | –        | Pflicht. Repository                      |
| `plan_id` | –        | Nur Snapshots, die dieser Plan erstellt hat |

Je Snapshot: `id`, `unixTimeMs`, `hostname`, `paths`, `tags` und `summary` mit neuen Dateien und Bytes.

### `list_snapshot_files`

| Parameter     | Standard | Beschreibung                      |
|---------------|----------|-----------------------------------|
| `repo_id`     | –        | Pflicht. Repository               |
| `snapshot_id` | –        | Pflicht. Snapshot                 |
| `path`        | `/`      | Verzeichnis im Snapshot           |

### `get_download_url`

Erzeugt einen signierten Link, mit dem du eine Datei oder ein Verzeichnis als `tar.gz` aus einem Snapshot oder einem fertigen Restore herunterlädst.

| Parameter      | Standard | Beschreibung                                                       |
|----------------|----------|--------------------------------------------------------------------|
| `snapshot_id`  | –        | Snapshot; der Server sucht die passende Index-Operation            |
| `operation_id` | –        | Alternativ die ID einer Restore- oder Index-Operation              |
| `file_path`    | leer     | Pfad im Snapshot oder Restore, leer für alles                      |

> [!WARNING]
> Der Link funktioniert ohne Anmeldung. Der Host kommt aus `BACKREST_MCP_BACKREST_PUBLIC_URL`.

### `restore_snapshot`

Stellt in ein neues Verzeichnis auf dem Backrest-Host (bzw. in seinem Container) wieder her. Gibt die ID der Operation zurück.

| Parameter     | Standard | Beschreibung                                                                |
|---------------|----------|-----------------------------------------------------------------------------|
| `repo_id`     | –        | Pflicht. Repository                                                         |
| `snapshot_id` | –        | Pflicht. Snapshot                                                           |
| `path`        | `/`      | Datei oder Verzeichnis im Snapshot                                          |
| `target`      | –        | Zielverzeichnis, darf noch nicht existieren; Standard `~/Downloads/restic-restore-<Zeit>` |
| `plan_id`     | –        | Plan des Snapshots                                                          |

### `forget_snapshots`

| Parameter     | Standard | Beschreibung                                                          |
|---------------|----------|-----------------------------------------------------------------------|
| `repo_id`     | –        | Pflicht. Repository                                                   |
| `plan_id`     | –        | Pflicht. Plan                                                         |
| `snapshot_id` | –        | Nur dieser Snapshot; ohne gilt die Aufbewahrungsregel des Plans       |

Der Platz wird erst beim nächsten Prune frei.

## Backups und Wartung

### `start_backup`

Wie „Backup now“ in Backrest. Backrest antwortet erst, wenn das Backup fertig ist, deshalb wartet der Server höchstens `wait_seconds`. Danach läuft das Backup weiter und das Tool meldet `status: running`.

| Parameter      | Standard | Beschreibung                                   |
|----------------|----------|------------------------------------------------|
| `plan_id`      | –        | Pflicht. Plan                                  |
| `dry_run`      | `false`  | Nur simulieren, es entsteht kein Snapshot      |
| `wait_seconds` | `10`     | 1 bis 3600 Sekunden                            |

### `cancel_operation`

| Parameter      | Beschreibung                          |
|----------------|---------------------------------------|
| `operation_id` | Pflicht. Operation, die abbrechen soll |

### `run_repo_task`

| Parameter | Beschreibung                                                                                              |
|-----------|-----------------------------------------------------------------------------------------------------------|
| `repo_id` | Pflicht. Repository                                                                                       |
| `task`    | Pflicht. `check`, `prune`, `forget` (Forget-Regel des Repositorys), `stats`, `index_snapshots`, `unlock`   |

Gibt die ID der geplanten Operation zurück. `unlock` läuft sofort.

### `run_command`

Führt einen restic-Befehl aus wie die Befehlskonsole von Backrest. Repository, Passwort und Flags ergänzt Backrest.

| Parameter        | Standard | Beschreibung                                        |
|------------------|----------|-----------------------------------------------------|
| `repo_id`        | –        | Pflicht. Repository                                 |
| `command`        | –        | Pflicht. Argumente ohne `restic`, z. B. `snapshots --compact` |
| `include_output` | `true`   | Ausgabe zurückgeben                                 |
| `max_bytes`      | `100000` | Maximale Größe der Ausgabe                          |

> [!CAUTION]
> Hier geht jeder restic-Befehl, auch `forget --prune` oder `key remove`.

### `clear_history`

Löscht Einträge aus dem Verlauf von Backrest, nicht die Snapshots.

| Parameter       | Standard | Beschreibung                                    |
|-----------------|----------|-------------------------------------------------|
| `plan_id`       | –        | Nur Operationen dieses Plans                    |
| `repo_id`       | –        | Nur Operationen dieses Repositorys              |
| `operation_ids` | –        | Genau diese Operationen                         |
| `only_failed`   | `false`  | Nur fehlgeschlagene Operationen                 |
| `all`           | `false`  | Nötig, um ohne jeden Filter zu löschen          |

## Konfiguration

### `set_config`

Ersetzt die komplette Konfiguration. Ablauf: `get_config`, Objekt ändern, in `config` zurückgeben. `modno` bleibt unverändert; hat jemand die Konfiguration zwischendurch geändert, lehnt Backrest den Aufruf mit `failed_precondition` ab. Werte, die als `********` erscheinen, setzt der Server aus der gespeicherten Konfiguration wieder ein.

### `add_repo`

Legt ein Repository an oder ändert das mit derselben `id`. Backrest initialisiert das restic-Repository bei Bedarf und liest seine Snapshots ein.

| Feld in `repo`    | Beschreibung                                                       |
|-------------------|--------------------------------------------------------------------|
| `id`              | Pflicht. Eindeutige ID                                             |
| `uri`             | Pflicht. restic-URI, z. B. `/backups/nas`, `sftp:user@host:/pfad`, `s3:…` |
| `password`        | Pflicht. Repository-Passwort, `********` behält das gespeicherte   |
| `env`, `flags`    | Zusätzliche Umgebungsvariablen (`KEY=VALUE`) und restic-Flags      |
| weitere Felder    | `prunePolicy`, `checkPolicy`, `forgetPolicy`, `hooks`, `autoUnlock` … wie in `get_config` |

### `check_repo_exists`

Dasselbe `repo`-Objekt wie bei `add_repo`; gibt `exists`, `error` und `hostKeyUntrusted` zurück. Ändert nichts.

### `remove_repo`

| Parameter | Beschreibung           |
|-----------|------------------------|
| `repo_id` | Pflicht. Repository    |

Entfernt das Repository aus Backrest und löscht seinen Verlauf. Die Daten im restic-Repository bleiben.

### `setup_sftp`

Erzeugt einen SSH-Schlüssel auf dem Backrest-Host und trägt den Host-Key des Servers in `known_hosts` ein. Gibt den öffentlichen Schlüssel zurück, den du in die `authorized_keys` des SFTP-Benutzers einträgst.

| Parameter  | Standard | Beschreibung                                        |
|------------|----------|-----------------------------------------------------|
| `host`     | –        | Pflicht. SFTP-Server                                |
| `username` | –        | Pflicht. SFTP-Benutzer                              |
| `port`     | `22`     | SSH-Port                                            |
| `password` | –        | Teil der API, von Backrest 1.14 noch nicht genutzt  |

### `path_autocomplete`

Listet die Einträge eines Verzeichnisses auf dem Backrest-Host, z. B. um Pfade für einen Plan zu finden.

### `hash_password`

Gibt den bcrypt-Hash eines Passworts für `auth.users[].passwordBcrypt` in `set_config` zurück. Ändert nichts.

## Multihost-Sync

### `get_peer_sync_states`

Verbindungsstatus, letzter Heartbeat, bekannte Pläne und Repositories und die entfernte Konfiguration aller Known Hosts und Authorized Clients. Parameter: keine.

### `generate_pairing_token`

| Parameter     | Standard | Beschreibung                                                                   |
|---------------|----------|--------------------------------------------------------------------------------|
| `label`       | –        | Pflicht. Bezeichnung des Tokens                                                |
| `ttl_seconds` | `3600`   | Lebensdauer, `0` ohne Ablauf                                                   |
| `max_uses`    | `1`      | Zahl der Clients, `0` unbegrenzt                                               |
| `permissions` | `[]`     | Liste aus `{type, scopes}`; `type`: `read_operations`, `read_config`, `read_write_config`, `receive_shared_repos`; `scopes`: `*`, `repo:<id>`, `plan:<id>`, `-repo:<id>`, `-plan:<id>` |

### `set_remote_client_config`

Schickt Pläne und Repositories an einen verbundenen Client oder löscht sie dort. Der Client muss `read_write_config` erlaubt haben.

| Parameter         | Beschreibung                                     |
|-------------------|--------------------------------------------------|
| `peer_keyid`      | Pflicht. Key-ID aus `get_peer_sync_states`       |
| `plans`, `repos`  | Pläne und Repositories, die angelegt oder geändert werden |
| `plans_to_delete`, `repos_to_delete` | IDs, die auf dem Client gelöscht werden |
