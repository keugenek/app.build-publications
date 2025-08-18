#!/usr/bin/env sh

# reset_env.sh — Reset and rebuild a Docker Compose project reproducibly
#
# Usage:
#   scripts/reset_env.sh [--project-dir PATH] [--no-build] [--aggressive] [--kill-port PORT[,PORT...]] [--kill-port-include-docker]
#
# - --project-dir PATH  Directory containing your docker-compose.yml/compose.yml (default: current dir)
# - --no-build          Skip the rebuild step
# - --aggressive        Also remove a stray "postgres" container and stop Docker containers binding host port 80
# - --kill-port PORTS   Kill non-Docker processes listening on given host TCP ports (e.g., 80 or 80,3000)
# - --kill-port-include-docker  Also kill Docker-related processes (e.g., com.docker) if they occupy those ports
#
# Notes:
# - This implements the assessor reset: docker compose down -v && docker volume prune -f && docker compose build --no-cache && docker compose up -d
# - Common conflicts like "/postgres is already in use" or "port 80 is already allocated" are handled when --aggressive is passed.

set -u

PROJECT_DIR="."
DO_BUILD=1
AGGRESSIVE=0
KILL_PORTS=""
INCLUDE_DOCKER_IN_KILL=0
NEED_DOCKER_RESTART=0

print_usage() {
  echo "Usage: scripts/reset_env.sh [--project-dir PATH] [--no-build] [--aggressive] [--kill-port PORT[,PORT...]] [--kill-port-include-docker]" 1>&2
}

# Parse args
while [ "$#" -gt 0 ]; do
  case "$1" in
    -p|--project-dir)
      if [ "${2:-}" = "" ]; then
        echo "Error: --project-dir requires a PATH" 1>&2; exit 2
      fi
      PROJECT_DIR="$2"; shift 2 ;;
    --no-build)
      DO_BUILD=0; shift ;;
    --aggressive)
      AGGRESSIVE=1; shift ;;
    --kill-port)
      if [ "${2:-}" = "" ]; then
        echo "Error: --kill-port requires a port number or a comma-separated list" 1>&2; exit 2
      fi
      KILL_PORTS="$2"; shift 2 ;;
    --kill-port-include-docker)
      INCLUDE_DOCKER_IN_KILL=1; shift ;;
    -h|--help)
      print_usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" 1>&2; print_usage; exit 2 ;;
  esac
done

# Helpers
aggressive_cleanup() {
  echo "[2/5] Aggressive cleanup: removing stray 'postgres' container if present" 1>&2
  if docker ps -a --format '{{.Names}}' | grep -q "^postgres$"; then
    docker rm -f postgres >/dev/null 2>&1 || true
  fi

  echo "[2.1/5] Aggressive cleanup: stopping Docker containers binding host port 80 (if any)" 1>&2
  CONTAINERS_80="$(docker ps --format '{{.ID}} {{.Ports}}' | awk '/(^|, )((0\.0\.0\.0)|(127\.0\.0\.1))?:?80->/ {print $1}')"
  for cid in $CONTAINERS_80; do
    docker stop "$cid" >/dev/null 2>&1 || true
  done
}

kill_processes_on_port() {
  PORT="$1"
  if ! command -v lsof >/dev/null 2>&1; then
    echo "Warning: lsof not found; cannot free port $PORT automatically" 1>&2
    return 0
  fi
  # Get listening PIDs on the port
  PIDS="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | sort -u)"
  [ -z "$PIDS" ] && return 0
  for pid in $PIDS; do
    # Skip Docker-related processes to avoid breaking Docker itself
    CMD="$(ps -o command= -p "$pid" 2>/dev/null | tr '\n' ' ')"
    if echo "$CMD" | grep -Eqi '(docker|com\.docker|containerd|dockerd|vpnkit|qemu|hyperkit|colima|rancher)'; then
      if [ "$INCLUDE_DOCKER_IN_KILL" -eq 0 ]; then
        # Do not kill Docker-related processes unless explicitly requested
        continue
      else
        NEED_DOCKER_RESTART=1
      fi
    fi
    echo "Killing PID $pid listening on port $PORT ($CMD)" 1>&2
    kill -TERM "$pid" 2>/dev/null || true
    sleep 0.5
    kill -KILL "$pid" 2>/dev/null || true
  done
}

# Basic checks
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH" 1>&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose is not available. Please install Docker Desktop 2.20+ or Compose v2." 1>&2
  exit 1
fi

# Move into project directory
cd "$PROJECT_DIR" 2>/dev/null || {
  echo "Error: cannot change directory to '$PROJECT_DIR'" 1>&2
  exit 1
}

# Ensure Docker daemon is running (macOS auto-start if needed)
ensure_docker_running() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  OS_NAME="$(uname -s 2>/dev/null || echo unknown)"
  if [ "$OS_NAME" = "Darwin" ]; then
    if command -v open >/dev/null 2>&1; then
      echo "Docker daemon not available. Attempting to start Docker Desktop..." 1>&2
      open -a Docker >/dev/null 2>&1 || true
    fi
  fi
  # Wait up to ~120s for Docker daemon
  attempts=0
  until docker info >/dev/null 2>&1; do
    attempts=$((attempts+1))
    if [ "$attempts" -ge 60 ]; then
      echo "Warning: Docker daemon did not become ready in time. You may need to start Docker manually." 1>&2
      break
    fi
    sleep 2
  done
}

ensure_docker_running

# Probe compose config (non-fatal if missing; commands may still work if Compose infers defaults)
if ! docker compose config >/dev/null 2>&1; then
  echo "Warning: docker compose config failed; ensure you're in the app project directory with a compose file." 1>&2
fi

echo "[1/5] Stopping and removing Compose resources (including volumes)" 1>&2
docker compose down -v >/dev/null 2>&1 || true

if [ "$AGGRESSIVE" -eq 1 ]; then
  aggressive_cleanup
fi

echo "[3/5] Pruning unused Docker volumes" 1>&2
docker volume prune -f >/dev/null 2>&1 || true

if [ "$DO_BUILD" -eq 1 ]; then
  echo "[4/5] Rebuilding images with no cache" 1>&2
  if ! docker compose build --no-cache; then
    echo "Error: docker compose build failed" 1>&2
    exit 1
  fi
else
  echo "[4/5] Skipping build as requested" 1>&2
fi

# Pre-flight port 80 check (informational)
if command -v lsof >/dev/null 2>&1; then
  if lsof -nP -iTCP:80 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Note: Something is already listening on host port 80. If 'docker compose up' fails with a bind error, retry with --aggressive or free the port." 1>&2
    lsof -nP -iTCP:80 -sTCP:LISTEN 2>/dev/null || true
  fi
fi

# Optionally free user-specified ports from non-Docker processes
if [ -n "$KILL_PORTS" ]; then
  OLDIFS="$IFS"; IFS=','
  for port in $KILL_PORTS; do
    # Trim spaces
    port_trimmed="$(echo "$port" | awk '{gsub(/^ +| +$/,"",$0); print}')"
    [ -n "$port_trimmed" ] && kill_processes_on_port "$port_trimmed"
  done
  IFS="$OLDIFS"

  # If we killed a Docker-related process (e.g., com.docker.backend), try to restart Docker and wait
  if [ "$NEED_DOCKER_RESTART" -eq 1 ]; then
    echo "Docker-related process was terminated to free ports; attempting to restart Docker..." 1>&2
    OS_NAME="$(uname -s 2>/dev/null || echo unknown)"
    if [ "$OS_NAME" = "Darwin" ]; then
      if command -d open >/dev/null 2>&1 || command -v open >/dev/null 2>&1; then
        open -a Docker >/dev/null 2>&1 || true
      fi
    fi
    # Wait up to ~120s for Docker daemon to become available
    attempts=0
    until docker info >/dev/null 2>&1; do
      attempts=$((attempts+1))
      if [ "$attempts" -ge 60 ]; then
        echo "Warning: Docker daemon did not become ready in time. You may need to start Docker manually." 1>&2
        break
      fi
      sleep 2
    done
  fi
fi

echo "[5/5] Starting containers in detached mode" 1>&2
if ! docker compose up -d; then
  echo "docker compose up failed." 1>&2
  if [ "$AGGRESSIVE" -eq 0 ]; then
    echo "Retrying once with aggressive cleanup..." 1>&2
    aggressive_cleanup
    ensure_docker_running
    if ! docker compose up -d; then
      echo "Error: docker compose up failed after aggressive retry." 1>&2
      echo "Hints: pass --kill-port 80 to free host port 80 (and optionally --kill-port-include-docker), or adjust compose port mappings." 1>&2
      exit 1
    fi
  else
    echo "Error: docker compose up failed. Common causes: host port 80 already in use, or conflicting container names." 1>&2
    echo "Hints: pass --kill-port 80 to free host port 80 (and optionally --kill-port-include-docker), or adjust compose port mappings." 1>&2
    exit 1
  fi
fi

echo "\nSuccess: environment reset complete." 1>&2
docker compose ps


