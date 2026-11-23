---
title: Tools
description: Reference of all 26 backrest-mcp tools for dashboard, operations, logs, snapshots, backups, restores, repository tasks, config and sync, with parameters.
order: 40
slug: tools
section: Reference
---

## Overview

| Tool                       | Kind      | Backrest procedure                  | Purpose                                              |
|----------------------------|-----------|-------------------------------------|------------------------------------------------------|
| `get_summary_dashboard`    | 📖 Read   | `GetSummaryDashboard`               | Status of all plans: last backup, failures, overdue |
| `get_config`               | 📖 Read   | `GetConfig`                         | Repositories, plans, hooks, users                    |
| `get_operations`           | 📖 Read   | `GetOperations`                     | Operation history with status and errors             |
| `watch_operation_events`   | 📖 Read   | `GetOperationEvents` (stream)       | Follow running operations live                       |
| `get_logs`                 | 📖 Read   | `GetLogs` (stream)                  | Log or output of an operation                        |
| `list_snapshots`           | 📖 Read   | `ListSnapshots`                     | Snapshots of a repository or plan                    |
| `list_snapshot_files`      | 📖 Read   | `ListSnapshotFiles`                 | Browse a directory inside a snapshot                 |
| `get_download_url`         | 📖 Read   | `GetDownloadURL`                    | Download link for files from a snapshot or restore   |
| `check_repo_exists`        | 📖 Read   | `CheckRepoExists`                   | Check a repository URI and password                  |
| `path_autocomplete`        | 📖 Read   | `PathAutocomplete`                  | List a directory on the Backrest host                |
| `get_peer_sync_states`     | 📖 Read   | `GetPeerSyncStatesStream` (stream)  | State of multihost sync peers                        |
| `get_metrics`              | 📖 Read   | `/metrics`                          | Prometheus metrics                                   |
| `hash_password`            | 📖 Read   | `Authentication/HashPassword`       | bcrypt hash for a new Backrest user                  |
| `start_backup`             | ✏️ Write  | `Backup`                            | Start a backup of a plan                             |
| `cancel_operation`         | ✏️ Write  | `Cancel`                            | Cancel a running operation                           |
| `run_repo_task`            | ⚠️ Destructive | `DoRepoTask`                        | check, prune, forget, stats, index, unlock           |
| `forget_snapshots`         | ⚠️ Destructive | `Forget`                            | Forget snapshots by policy or one by ID              |
| `restore_snapshot`         | ✏️ Write  | `Restore`                           | Restore into a new directory on the host             |
| `run_command`              | ⚠️ Destructive | `RunCommand`                        | Run any restic command                               |
| `clear_history`            | ⚠️ Destructive | `ClearHistory`                      | Delete entries of the operation history              |
| `set_config`               | ⚠️ Destructive | `SetConfig`                         | Replace the complete config                          |
| `add_repo`                 | ⚠️ Destructive | `AddRepo`                           | Add or update a repository                           |
| `remove_repo`              | ⚠️ Destructive | `RemoveRepo`                        | Remove a repository from Backrest                    |
| `setup_sftp`               | ✏️ Write  | `SetupSftp`                         | Create an SSH key for an SFTP repository             |
| `generate_pairing_token`   | ✏️ Write  | `GeneratePairingToken`              | Pairing token for multihost sync                     |
| `set_remote_client_config` | ⚠️ Destructive | `BackrestSyncStateService`          | Push plans and repositories to a peer                |

⚠️ marks tools with `destructiveHint`: they overwrite or delete data. In the default mode (`BACKREST_MCP_READ_ONLY=true`) only the 📖 tools are available.

Not available as tools: `Authentication/Login` (the server authenticates itself with the configured credentials) and `BackrestSyncService/Sync`, the bidirectional protocol between Backrest instances.

> [!NOTE]
> IDs of operations and other int64 values are strings, times are unix milliseconds. Repositories and plans are addressed by the IDs from `get_config`.

## Status and history

### `get_summary_dashboard`

The dashboard of Backrest, per plan and repository. By default in a compact form:

| Field                                                   | Description                                                    |
|---------------------------------------------------------|----------------------------------------------------------------|
| `backupsSuccessLast30days`, `backupsFailedLast30days`, `backupsWarningLast30days` | Backups of the last 30 days by result      |
| `bytesScannedLast30days`, `bytesAddedLast30days`        | Bytes read and added in the last 30 days                       |
| `protectedBytes`                                        | Size of the data covered by the last good backup               |
| `lastBackup`, `lastFailure`                             | Time, status, duration, bytes added and flow ID of the most recent backup and of the most recent one that did not succeed, or `null` |
| `overdue`                                               | The last good backup is older than the schedule allows         |
| `nextBackupTimeMs`                                      | Next scheduled backup, `null` without a schedule               |

| Parameter         | Default | Description                                                                          |
|-------------------|---------|--------------------------------------------------------------------------------------|
| `plan_id`         | –       | Only this plan; without `repo_id` no repositories are returned                       |
| `repo_id`         | –       | Only this repository; without `plan_id` no plans are returned                        |
| `include_history` | `false` | The raw dashboard of Backrest with the backup charts and the per-day history instead |

> [!TIP]
> The raw dashboard is large – several 100 KB for a few dozen plans. Use `include_history` only together with `plan_id` or `repo_id`.

### `get_config`

The complete config: instance name, repositories, plans with schedule, retention and hooks, users (password hashes always `********`) and multihost settings. Parameters: none.

### `get_operations`

The operation history, oldest first.

| Parameter       | Default | Description                                                      |
|-----------------|---------|------------------------------------------------------------------|
| `plan_id`       | –       | Only operations of this plan                                     |
| `repo_id`       | –       | Only operations of this repository (resolved to its GUID)        |
| `snapshot_id`   | –       | Only operations of this snapshot                                 |
| `flow_id`       | –       | Only operations of one run, e.g. backup plus its hooks            |
| `instance_id`   | –       | Only operations of this Backrest instance                        |
| `operation_ids` | –       | Exactly these operations, cannot be combined with the others     |
| `last_n`        | `50`    | Only the latest n operations, `0` for all                        |

Each operation has `status` (`STATUS_SUCCESS`, `STATUS_ERROR`, `STATUS_WARNING`, `STATUS_INPROGRESS` …), `unixTimeStartMs`, `unixTimeEndMs`, `displayMessage` (usually the error) and one block for its kind, e.g. `operationBackup` with progress and errors.

### `watch_operation_events`

Listens to the live stream of Backrest and returns all created, updated and deleted operations in that time. Keep-alive messages are filtered out.

| Parameter          | Default | Description              |
|--------------------|---------|--------------------------|
| `duration_seconds` | `30`    | 1 to 300 seconds         |

### `get_logs`

Log or output of an operation. Long logs are cut from the start, because errors are usually at the end.

| Parameter      | Default  | Description                                           |
|----------------|----------|-------------------------------------------------------|
| `operation_id` | –        | Operation whose log is wanted                         |
| `ref`          | –        | Alternatively the log reference (`logref`, `outputLogref`) |
| `max_bytes`    | `100000` | Maximum size of the returned log                      |

### `get_metrics`

The Prometheus metrics of Backrest as text.

| Parameter | Default | Description                                         |
|-----------|---------|-----------------------------------------------------|
| `filter`  | –       | Only lines containing this text, e.g. `backrest_backup` |

## Snapshots

### `list_snapshots`

| Parameter | Default | Description                            |
|-----------|---------|----------------------------------------|
| `repo_id` | –       | Required. Repository                   |
| `plan_id` | –       | Only snapshots created by this plan    |

Returned per snapshot: `id`, `unixTimeMs`, `hostname`, `paths`, `tags` and `summary` with files and bytes added.

### `list_snapshot_files`

| Parameter     | Default | Description                    |
|---------------|---------|--------------------------------|
| `repo_id`     | –       | Required. Repository           |
| `snapshot_id` | –       | Required. Snapshot             |
| `path`        | `/`     | Directory inside the snapshot  |

### `get_download_url`

Creates a signed link to download a file, or a directory as `tar.gz`, from a snapshot or from a finished restore.

| Parameter      | Default | Description                                                         |
|----------------|---------|---------------------------------------------------------------------|
| `snapshot_id`  | –       | Snapshot; the server looks up the matching index operation          |
| `operation_id` | –       | Alternatively the ID of a restore or index operation                |
| `file_path`    | empty   | Path inside the snapshot or restore, empty for everything           |

> [!WARNING]
> The link works without login. The host comes from `BACKREST_MCP_BACKREST_PUBLIC_URL`.

### `restore_snapshot`

Restores into a new directory on the Backrest host (or in its container). Returns the ID of the operation.

| Parameter     | Default | Description                                                               |
|---------------|---------|---------------------------------------------------------------------------|
| `repo_id`     | –       | Required. Repository                                                      |
| `snapshot_id` | –       | Required. Snapshot                                                        |
| `path`        | `/`     | File or directory inside the snapshot                                     |
| `target`      | –       | Target directory, must not exist yet; default `~/Downloads/restic-restore-<time>` |
| `plan_id`     | –       | Plan of the snapshot                                                      |

### `forget_snapshots`

| Parameter     | Default | Description                                                       |
|---------------|---------|-------------------------------------------------------------------|
| `repo_id`     | –       | Required. Repository                                              |
| `plan_id`     | –       | Required. Plan                                                    |
| `snapshot_id` | –       | Only this snapshot; without it the retention policy of the plan applies |

The data is only freed by the next prune.

## Backups and maintenance

### `start_backup`

Like "Backup now" in Backrest. Backrest only answers when the backup is done, so the server waits at most `wait_seconds`. After that the backup keeps running and the tool returns `status: running`.

| Parameter      | Default | Description                                  |
|----------------|---------|----------------------------------------------|
| `plan_id`      | –       | Required. Plan                               |
| `dry_run`      | `false` | Simulate, no snapshot is created             |
| `wait_seconds` | `10`    | 1 to 3600 seconds                            |

### `cancel_operation`

| Parameter      | Description                     |
|----------------|---------------------------------|
| `operation_id` | Required. Operation to cancel   |

### `run_repo_task`

| Parameter | Description                                                                                         |
|-----------|-----------------------------------------------------------------------------------------------------|
| `repo_id` | Required. Repository                                                                                |
| `task`    | Required. `check`, `prune`, `forget` (forget policy of the repository), `stats`, `index_snapshots`, `unlock` |

Returns the ID of the scheduled operation. `unlock` runs immediately.

### `run_command`

Runs a restic command like the command console of Backrest. Backrest adds repository, password and flags.

| Parameter        | Default  | Description                                       |
|------------------|----------|---------------------------------------------------|
| `repo_id`        | –        | Required. Repository                              |
| `command`        | –        | Required. Arguments without `restic`, e.g. `snapshots --compact` |
| `include_output` | `true`   | Return the output                                 |
| `max_bytes`      | `100000` | Maximum size of the output                        |

> [!CAUTION]
> Any restic command works here, including `forget --prune` or `key remove`.

### `clear_history`

Deletes entries of the operation history in Backrest, not the snapshots.

| Parameter       | Default | Description                                         |
|-----------------|---------|-----------------------------------------------------|
| `plan_id`       | –       | Only operations of this plan                        |
| `repo_id`       | –       | Only operations of this repository                  |
| `operation_ids` | –       | Exactly these operations                            |
| `only_failed`   | `false` | Only failed operations                              |
| `all`           | `false` | Required to clear without any filter                |

## Configuration

### `set_config`

Replaces the complete config. Workflow: `get_config`, change the object, pass it back in `config`. `modno` must stay unchanged; if someone changed the config in between, Backrest rejects the call with `failed_precondition`. Values shown as `********` are restored from the stored config.

### `add_repo`

Adds a repository or updates the one with the same `id`. Backrest initializes the restic repository if needed and indexes its snapshots.

| Field in `repo`   | Description                                                       |
|-------------------|-------------------------------------------------------------------|
| `id`              | Required. Unique ID                                               |
| `uri`             | Required. restic URI, e.g. `/backups/nas`, `sftp:user@host:/path`, `s3:…` |
| `password`        | Required. Repository password, `********` keeps the stored one    |
| `env`, `flags`    | Extra environment variables (`KEY=VALUE`) and restic flags        |
| further fields    | `prunePolicy`, `checkPolicy`, `forgetPolicy`, `hooks`, `autoUnlock` … as in `get_config` |

### `check_repo_exists`

Same `repo` object as `add_repo`; returns `exists`, `error` and `hostKeyUntrusted`. Changes nothing.

### `remove_repo`

| Parameter | Description            |
|-----------|------------------------|
| `repo_id` | Required. Repository   |

Removes the repository from Backrest and deletes its operation history. The data in the restic repository stays.

### `setup_sftp`

Creates an SSH key on the Backrest host and adds the host key of the server to `known_hosts`. Returns the public key, which you add to `authorized_keys` of the SFTP user.

| Parameter  | Default | Description                                         |
|------------|---------|-----------------------------------------------------|
| `host`     | –       | Required. SFTP server                               |
| `username` | –       | Required. SFTP user                                 |
| `port`     | `22`    | SSH port                                            |
| `password` | –       | Part of the API, not used by Backrest 1.14 yet      |

### `path_autocomplete`

Lists the entries of a directory on the Backrest host, e.g. to find paths for a plan.

### `hash_password`

Returns the bcrypt hash of a password for `auth.users[].passwordBcrypt` in `set_config`. Changes nothing.

## Multihost sync

### `get_peer_sync_states`

Connection state, last heartbeat, known plans and repositories and the remote config of all known hosts and authorized clients. Parameters: none.

### `generate_pairing_token`

| Parameter     | Default | Description                                                                    |
|---------------|---------|--------------------------------------------------------------------------------|
| `label`       | –       | Required. Label of the token                                                   |
| `ttl_seconds` | `3600`  | Lifetime, `0` without expiry                                                   |
| `max_uses`    | `1`     | Number of clients, `0` unlimited                                               |
| `permissions` | `[]`    | List of `{type, scopes}`; `type`: `read_operations`, `read_config`, `read_write_config`, `receive_shared_repos`; `scopes`: `*`, `repo:<id>`, `plan:<id>`, `-repo:<id>`, `-plan:<id>` |

### `set_remote_client_config`

Pushes plans and repositories to a connected client or deletes them there. The client must have granted `read_write_config`.

| Parameter         | Description                                      |
|-------------------|--------------------------------------------------|
| `peer_keyid`      | Required. Key ID from `get_peer_sync_states`     |
| `plans`, `repos`  | Plans and repositories to create or update       |
| `plans_to_delete`, `repos_to_delete` | IDs to delete on the client   |
