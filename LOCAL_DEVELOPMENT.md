# LKM-SEP v2 — Local Development (Without Docker)

Running without Docker saves significant memory and disk space. This guide walks you through setting up everything natively on your machine.

> **Tested:** February 26, 2026 — Node.js v20.19.5, Yarn 1.22.22, MongoDB 7, Redis 7 on Ubuntu Linux.

---

## Table of Contents

- [Why Run Without Docker?](#why-run-without-docker)
- [Prerequisites](#prerequisites)
- [Step 1: Install System Dependencies](#step-1-install-system-dependencies)
  - [Node.js v20](#nodejs-v20)
  - [MongoDB 7](#mongodb-7)
  - [Redis 7](#redis-7)
- [Step 2: Install Project Dependencies](#step-2-install-project-dependencies)
- [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
- [Step 4: Start Services](#step-4-start-services)
- [Step 5: Start the Application](#step-5-start-the-application)
- [Running Everything in One Command](#running-everything-in-one-command)
- [Default Login Credentials](#default-login-credentials)
- [Accessing the Application](#accessing-the-application)
- [Common Tasks](#common-tasks)
- [Known Warnings](#known-warnings)
- [Troubleshooting](#troubleshooting)
- [Stopping Services](#stopping-services)
- [Uninstalling Services](#uninstalling-services)

---

## Why Run Without Docker?

|                  | Docker                                      | Local (No Docker)               |
| ---------------- | ------------------------------------------- | ------------------------------- |
| **RAM Usage**    | ~1.5–3 GB (Docker Desktop + containers)     | ~300–600 MB (just the services) |
| **Disk Usage**   | ~5–10 GB (images + volumes + Docker Engine) | ~500 MB (just dependencies)     |
| **Startup Time** | 30–60s (build + health checks)              | 5–10s                           |
| **CPU Overhead** | Higher (virtualization layer)               | Lower (native processes)        |

---

## Prerequisites

| Requirement | Version        | Check Command    | Purpose                               |
| ----------- | -------------- | ---------------- | ------------------------------------- |
| **Node.js** | v20.x          | `node --version` | Runtime for both frontend and backend |
| **Yarn**    | v1.x (Classic) | `yarn --version` | Package manager (workspaces)          |
| **MongoDB** | v7.x           | `mongosh --eval "db.version()"` | Primary database           |
| **Redis**   | v7.x           | `redis-cli ping` | Caching layer                         |
| **Git**     | 2.x            | `git --version`  | Version control                       |

---

## Step 1: Install System Dependencies

### Node.js v20

**Option A: Using nvm (Recommended)**

```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version   # Should show v20.x.x
```

**Option B: Using NodeSource**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Install Yarn (Classic)**

```bash
npm install -g yarn

# Verify
yarn --version   # Should show 1.x.x
```

---

### MongoDB 7

**Ubuntu/Debian:**

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add repository (Ubuntu 22.04 — adjust "jammy" for your release)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start & enable on boot
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }
```

---

### Redis 7

**Ubuntu/Debian:**

```bash
# Add Redis repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/redis.list

# Install
sudo apt-get update
sudo apt-get install -y redis

# Start & enable on boot
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping   # Should return "PONG"
```

---

## Step 2: Install Project Dependencies

```bash
# Navigate to the project root
cd st_lkm_sep

# Install all workspace dependencies (app + graphql)
yarn install
```

> **Note:** This is a Yarn Workspaces + Lerna monorepo. Running `yarn install` at the root installs dependencies for both `services/app` and `services/graphql` automatically.

If you encounter issues with `yarn install`, try:

```bash
yarn install --frozen-lockfile --production=false --ignore-engines --network-timeout 600000
```

---

## Step 3: Configure Environment Variables

```bash
# Copy the template
cp .env.example .env
```

The default values in `.env.example` are already configured for local development. **Minimum required settings:**

```env
# --- App (Next.js Frontend) ---
APP_PORT=9100

# --- GraphQL API ---
GRAPHQL_API_HOST=localhost
GRAPHQL_API_PORT=9101
GRAPHQL_API_BIND_IP=0.0.0.0

# --- MongoDB (running locally) ---
MONGOD_HOST=localhost
MONGOD_PORT=27017
MONGOD_DB=lkm-sep-v2

# --- Redis (running locally) ---
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# --- Auth (REQUIRED — must have values) ---
APP_SECRET=lkm-sep-v2-secret-key
TOKENIZE=lkm-sep-v2-tokenize-key
```

> **Important:** `APP_SECRET` and `TOKENIZE` must have non-empty values. Without them, JWT authentication will fail with `"secretOrPrivateKey must have a value"`.

> **Note:** Optional services (ClickHouse, AWS S3, AWS SES, Telegram) are commented out in `.env.example`. The app will start without them — you will see harmless warnings like `! Not connected to AWS, missing access key or secret key!`.

---

## Step 4: Start Services

Make sure MongoDB and Redis are running before starting the application:

```bash
# Check MongoDB status
sudo systemctl status mongod
# Expected: Active: active (running)

# Check Redis status
sudo systemctl status redis-server
# Expected: Active: active (running)
```

If they are not running:

```bash
sudo systemctl start mongod
sudo systemctl start redis-server
```

**Quick verification:**

```bash
mongosh --eval "db.adminCommand('ping')" --quiet   # { ok: 1 }
redis-cli ping                                       # PONG
```

---

## Step 5: Start the Application

You need **two terminals** — one for the backend (GraphQL API) and one for the frontend (Next.js App).

### Terminal 1 — Start GraphQL API

```bash
cd st_lkm_sep

# Development mode (with nodemon auto-restart)
yarn graphql:dev
```

Wait until you see:

```
lkm-sep-v2-graphql: > Connected to MongoDB [mongodb://localhost:27017/lkm-sep-v2]
lkm-sep-v2-graphql: 🚀  GraphQL server ready at http://0.0.0.0:9101/graphql
```

This means:

- MongoDB connection is established
- Default admin user is seeded (on first run)
- GraphQL Playground is available at http://localhost:9101/graphql

> **Note:** You will also see deprecation warnings about the Telegram Bot API and AWS SDK v2 — these are harmless and do not affect functionality. See [Known Warnings](#known-warnings).

### Terminal 2 — Start Next.js App

```bash
cd st_lkm_sep

# Development mode (with nodemon + Next.js HMR)
yarn app:dev
```

Wait until you see:

```
lkm-sep-v2-app: > Ready on http://localhost:9100/lkm
```

> **Note:** First startup compiles pages on-demand. The first page load (e.g., `/lkm/login`) takes ~10 seconds to compile (~993 modules). Subsequent loads are fast.

**Alternatively**, you can start services directly in their directories:

```bash
# Terminal 1 — GraphQL API (from services/graphql/)
cd services/graphql
node index.js

# Terminal 2 — Next.js App (from services/app/)
cd services/app
NODE_OPTIONS='--openssl-legacy-provider' node server/index.js
```

---

## Running Everything in One Command

A `dev` script is available in the root `package.json` to start both services concurrently:

```bash
cd st_lkm_sep
yarn dev
```

This runs both `yarn graphql:dev` and `yarn app:dev` side by side with colored, prefixed output:

- `[GRAPHQL]` — Blue — GraphQL API logs
- `[APP]` — Green — Next.js App logs

---

## Default Login Credentials

On first startup, the system seeds a default admin user:

| Field           | Value      |
| --------------- | ---------- |
| **Employee ID** | `root`     |
| **Password**    | `toor`     |
| **Role**        | Super User |

> **Recommendation:** Change the default password after first login.

---

## Accessing the Application

| Service                | URL                             | Notes                       |
| ---------------------- | ------------------------------- | --------------------------- |
| **Web Application**    | http://localhost:9100/lkm       | Main application            |
| **Login Page**         | http://localhost:9100/lkm/login | Authentication              |
| **GraphQL Playground** | http://localhost:9101/graphql   | Dev mode only               |
| **MongoDB**            | `localhost:27017`               | Connect via MongoDB Compass |
| **Redis**              | `localhost:6379`                | Connect via `redis-cli`     |

---

## Common Tasks

### Building Next.js for Production

```bash
cd services/app
cross-env NODE_OPTIONS='--max_old_space_size=4096 --openssl-legacy-provider' npx next build
```

### Running in Production Mode

```bash
# Terminal 1 — GraphQL
yarn graphql

# Terminal 2 — App (must build first)
yarn app
```

### Database Backup / Restore

```bash
cd services/graphql

# Full backup
node utilities/db-backup.js

# Minimal backup
node utilities/db-backup.js --minimal

# Restore
node utilities/db-restore.js
```

### Access MongoDB Shell

```bash
mongosh lkm-sep-v2
```

### Generate API Documentation

```bash
cd services/graphql

# Development (live-reload)
npx spectaql spectaql-config.yml -D

# Build static docs
npx spectaql spectaql-config.yml
```

---

## Known Warnings

These warnings appear during startup and are **harmless** — they do not affect functionality:

### Telegram Bot API Deprecation

```
node-telegram-bot-api deprecated Automatic enabling of cancellation of promises is deprecated.
```

The `node-telegram-bot-api` package shows this deprecation notice. It does not affect the application. The Telegram notification feature still works if `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are configured.

### AWS SDK v2 End of Support

```
(node:XXXXX) NOTE: The AWS SDK for JavaScript (v2) has reached end-of-support.
Please migrate your code to use AWS SDK for JavaScript (v3).
```

The project uses `aws-sdk` v2 for S3 and SES integration. It still functions correctly but should be migrated to v3 in a future update.

### AWS / S3 Not Connected

```
! Not connected to AWS, missing access key or secret key!
```

This appears when S3 credentials are not configured in `.env`. File upload features (S3 storage) will be unavailable, but all other functionality works normally.

### Tailwind JIT Preview Warning

```
warn - You have enabled the JIT engine which is currently in preview.
warn - Preview features are not covered by semver, may introduce breaking changes, and can change at any time.
```

The project uses Tailwind CSS 2.x with JIT mode. This is a known informational warning and does not affect styling.

---

## Troubleshooting

### "secretOrPrivateKey must have a value"

**Cause:** `TOKENIZE` or `APP_SECRET` is empty or missing in `.env`.

**Fix:** Ensure `.env` has non-empty values:

```env
APP_SECRET=lkm-sep-v2-secret-key
TOKENIZE=lkm-sep-v2-tokenize-key
```

### "Cannot find module" errors

**Fix:** Reinstall dependencies:

```bash
rm -rf node_modules services/app/node_modules services/graphql/node_modules
yarn install
```

### MongoDB connection refused

**Cause:** MongoDB service is not running.

**Fix:**

```bash
sudo systemctl start mongod
sudo systemctl status mongod
# Expected: Active: active (running)
```

### Redis connection refused

**Cause:** Redis service is not running.

**Fix:**

```bash
sudo systemctl start redis-server
sudo systemctl status redis-server
```

### "Unknown employee id root"

**Cause:** Default user was seeded without `employeeId` field.

**Fix:**

```bash
mongosh lkm-sep-v2 --eval \
  'db.Users.updateOne({ _id: "__ROOT__" }, { $set: { employeeId: "root", status: "Active" } })'
```

### Port already in use

```bash
# Check what's using the port
lsof -i :9100
lsof -i :9101

# Kill the process
kill -9 <PID>
```

### Node.js OpenSSL errors (ERR_OSSL_EVP_UNSUPPORTED)

**Cause:** Next.js / Webpack uses legacy OpenSSL features not available in newer Node.js.

**Fix:** The `app:dev` script in `services/app/package.json` already includes `--openssl-legacy-provider` via `cross-env`. If running manually:

```bash
export NODE_OPTIONS="--openssl-legacy-provider"
```

### Out of memory during Next.js build

**Fix:** Increase Node.js memory limit:

```bash
export NODE_OPTIONS="--max_old_space_size=4096 --openssl-legacy-provider"
```

### "Incomplete environment variables. Process exitting..."

**Cause:** One or more required environment variables (`MONGOD_HOST`, `MONGOD_PORT`, `MONGOD_DB`, `APP_PORT`, `GRAPHQL_API_HOST`, `GRAPHQL_API_PORT`) is missing.

**Fix:** Ensure `.env` file exists at the project root and contains all required variables. The `.env` file must be in the monorepo root (not inside `services/`) because both services load it from `../../.env`.

```bash
cp .env.example .env
```

---

## Stopping Services

```bash
# Stop GraphQL and App
# Press Ctrl+C in each terminal (or in the yarn dev terminal)

# Stop MongoDB
sudo systemctl stop mongod

# Stop Redis
sudo systemctl stop redis-server
```

---

## Uninstalling Services

If you no longer need the local services:

```bash
# Remove MongoDB
sudo systemctl stop mongod
sudo apt-get purge -y mongodb-org*
sudo rm -rf /var/lib/mongodb /var/log/mongodb

# Remove Redis
sudo systemctl stop redis-server
sudo apt-get purge -y redis*

# Remove Node.js (if using nvm)
nvm deactivate
nvm uninstall 20
```

---

## Quick Reference

```bash
# === One-time setup ===
cp .env.example .env              # Configure environment
yarn install                      # Install dependencies

# === Daily workflow ===
sudo systemctl start mongod       # Start MongoDB
sudo systemctl start redis-server # Start Redis
yarn dev                          # Start both API + App (single terminal)

# Or in separate terminals:
yarn graphql:dev                  # Terminal 1: Start GraphQL API
yarn app:dev                      # Terminal 2: Start Next.js App

# === Access ===
# App:     http://localhost:9100/lkm
# Login:   http://localhost:9100/lkm/login  (root / toor)
# GraphQL: http://localhost:9101/graphql
```
