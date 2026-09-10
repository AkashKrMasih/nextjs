#!/bin/bash
#
# recreate_db.sh
#
# Drops and recreates a PostgreSQL database.
# Prompts interactively for username, password, and database name.
#
# Usage:
#   bash recreate_db.sh
#
# Optional: set PGHOST / PGPORT env vars beforehand if not connecting
# to localhost:5432, e.g.:
#   PGHOST=myhost.example.com PGPORT=5433 bash recreate_db.sh

set -euo pipefail

HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"

# --- Prompt for inputs ---
read -rp "Postgres username: " PG_USER
read -rsp "Postgres password: " PG_PASSWORD
echo
read -rp "Database name to recreate: " DB_NAME

if [[ -z "$PG_USER" || -z "$DB_NAME" ]]; then
    echo "Error: username and database name cannot be empty." >&2
    exit 1
fi

export PGPASSWORD="$PG_PASSWORD"

# --- Confirm before destructive action ---
read -rp "This will DROP and recreate database '$DB_NAME' on ${HOST}:${PORT}. Continue? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    unset PGPASSWORD
    exit 0
fi

# --- Terminate active connections to the database (so DROP doesn't fail) ---
echo "Terminating active connections to '$DB_NAME'..."
psql -h "$HOST" -p "$PORT" -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" || true

# --- Drop database if it exists ---
echo "Dropping database '$DB_NAME' if it exists..."
psql -h "$HOST" -p "$PORT" -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

# --- Create database ---
echo "Creating database '$DB_NAME'..."
psql -h "$HOST" -p "$PORT" -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$PG_USER\";"

unset PGPASSWORD

echo "Done. Database '$DB_NAME' has been recreated."
