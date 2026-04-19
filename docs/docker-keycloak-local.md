# Local Keycloak with Docker (for this project)

This guide is for **learning Docker** and **learning Keycloak** while running a local identity server for the React + Vite app in this repository. It pairs with the optional SPA integration (OpenID Connect) when you wire `keycloak-js` into the app.

---

## Part 1 — Docker concepts (quick mental model)

### Image vs container

- **Image** — A read-only template (filesystem + default command). Think “class” or “recipe.” This project uses the official **Keycloak image** from Quay (`quay.io/keycloak/keycloak`).
- **Container** — A running (or stopped) instance of an image. Think “object” or “running process.” You can start many containers from one image.

### Docker Compose

**Compose** is a YAML file that describes one or more services (containers), their images, ports, and environment variables. Instead of remembering long `docker run ...` commands, you run:

```bash
docker compose -f docker-compose.keycloak.yml up -d
```

The `-f` flag picks our file; `-d` runs in the background (**detached**).

### Ports: host vs container

In `docker-compose.keycloak.yml` you will see:

```yaml
ports:
  - '8080:8080'
```

That means: **port 8080 on your computer** (the **host**) maps to **port 8080 inside the container**. Your browser talks to `http://localhost:8080` on the host; Docker forwards traffic into Keycloak.

### Environment variables

Containers often need config (admin username, passwords). Compose can pass them with `environment:` or from a file. We use a **gitignored** `.env.keycloak` so you do not commit passwords. A committed **`.env.keycloak.example`** shows the variable names only.

### Volumes (not used in our minimal setup)

Keycloak `start-dev` uses an **embedded database** suitable for learning. Data **lives inside the container** by default: if you remove the container, **realm and users can be lost**. For serious local dev, you would add a **named volume** or an external database service—out of scope for the first pass; see the official Keycloak docs when you outgrow `start-dev`.

---

## Part 2 — Keycloak concepts (what you are actually running)

### What Keycloak is

**Keycloak** is an **identity and access management (IAM)** server. For a React SPA, the important surface is usually **OpenID Connect (OIDC)** built on **OAuth 2.0**:

- Users **authenticate** with Keycloak (login page).
- Keycloak issues **tokens** (typically an **access token** and **ID token**) your app can use to know **who** signed in and to call APIs.

You do **not** store user passwords in your React app—Keycloak does.

### Realm

A **realm** is an isolated space for users, clients, and settings. Think “tenant” or “project boundary.” For this demo you might create a realm named `demo` next to Keycloak’s built-in `master` realm.

- **`master`** — Administration realm; use it to create other realms, then do day-to-day work in your app realm.

### Client (OIDC client)

A **client** is an application that can use Keycloak. Your **Vite SPA** will be a **public client** (no client secret in the browser):

- **Client type**: OpenID Connect.
- **Access type / capability**: public (in newer UIs this is expressed as client authentication off).
- **Standard flow** (authorization code) — what browser SPAs use with **PKCE** (proof key for code exchange).

You will configure **Valid redirect URIs** (where Keycloak may send the user after login) and **Web origins** (CORS for browser calls to Keycloak).

### User

A **user** is an account that can log in. You create at least one test user in your realm to try the login flow.

### Tokens (high level)

- **ID token** — JWT with identity claims (name, email, subject). Good for **display** in the UI; authorization in the browser is convenience only.
- **Access token** — Often a JWT; sent to **APIs** as `Authorization: Bearer ...`. **APIs must validate** the token (signature, issuer, audience, expiry)—never trust the UI alone.

### Why PKCE for SPAs

Public clients cannot keep a secret. **PKCE** secures the authorization-code exchange so intercepted codes are harder to abuse. Your SPA integration should use PKCE (`S256`) with the Keycloak JS adapter or another OIDC library that supports it.

---

## Part 3 — Prerequisites

1. **Docker Desktop** (macOS/Windows) or **Docker Engine + Compose v2** (Linux). Install from [Docker’s documentation](https://docs.docker.com/get-docker/).
2. **Roughly 1 GB free RAM** for Keycloak in dev mode (more is smoother).
3. **Port 8080 free** on your machine. If something else uses 8080, change the **left** side of the port mapping in `docker-compose.keycloak.yml` (for example `'8081:8080'`) and use `http://localhost:8081` in the admin URL and redirect URIs.

---

## Part 4 — Run Keycloak for this repository

### 1. Admin credentials (recommended)

Copy the example env file and set a password:

```bash
cp .env.keycloak.example .env.keycloak
# Edit .env.keycloak — set KEYCLOAK_ADMIN_PASSWORD to something you remember
```

`.env.keycloak` is gitignored.

### 2. Start Keycloak

From the **repository root**:

```bash
docker compose --env-file .env.keycloak -f docker-compose.keycloak.yml up -d
```

If you skip the env file, Compose falls back to `KEYCLOAK_ADMIN=admin` and `KEYCLOAK_ADMIN_PASSWORD=admin` (fine for quick local tries only).

### 3. Wait for startup, then open the console

Keycloak can take **30–90 seconds** the first time.

- **Admin console**: [http://localhost:8080](http://localhost:8080)  
  Sign in with `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` from `.env.keycloak`.

### 4. Useful commands

| Goal | Command |
|------|---------|
| Follow logs | `docker compose -f docker-compose.keycloak.yml logs -f keycloak` |
| Stop | `docker compose -f docker-compose.keycloak.yml stop` |
| Remove containers (keep image) | `docker compose -f docker-compose.keycloak.yml down` |
| Remove container **and** dev DB inside it | `docker compose -f docker-compose.keycloak.yml down` — data inside the container filesystem may still be gone on recreate; for a clean slate, `docker rm` the container or add `-v` only if you add named volumes later |

---

## Part 5 — Keycloak checklist (first realm and SPA client)

Do this in the **admin console** once Keycloak is healthy.

### A. Create a realm

1. Hover **master** (top left) → **Create realm**.
2. **Realm name**: e.g. `demo` → **Create**.

### B. Create a test user

1. Realm **demo** → **Users** → **Create new user**.
2. Set **Username**, enable **Email verified** if you like, **Create**.
3. Open the user → **Credentials** → **Set password** (turn off **Temporary** for local dev).

### C. Create a public OIDC client for the Vite app

1. **Clients** → **Create client**.
2. **Client ID**: e.g. `react-storybook-spa` (you will reuse this in `VITE_KEYCLOAK_CLIENT_ID` later).
3. **Client authentication**: **Off** (public client).
4. **Authorization**: off for the minimal flow unless you need it.
5. **Login settings**:
   - **Root URL**: `http://localhost:5173`
   - **Home URL**: `http://localhost:5173`
   - **Valid redirect URIs**: `http://localhost:5173/*`
   - **Valid post logout redirect URIs**: `http://localhost:5173/*`
   - **Web origins**: `http://localhost:5173`
6. Save.

### D. Tighten grants (production-minded habit)

In the client **Advanced** / capability settings, prefer **Standard flow** for this SPA; turn **Direct access grants** **off** unless you have a specific reason (resource-owner password flow is a poor fit for browser apps).

### E. Values you will copy into the React app (later)

| Concept | Example | Notes |
|---------|---------|--------|
| Keycloak URL | `http://localhost:8080` | Base URL; adapter adds `/realms/...` |
| Realm | `demo` | |
| Client ID | `react-storybook-spa` | Must match the client you created |

These are **not secrets** for a public client; they still belong in `.env` / `import.meta.env` with a `VITE_` prefix when you integrate the SPA.

---

## Part 6 — How this ties to the React app

- **Vite dev server** defaults to [http://localhost:5173](http://localhost:5173).
- Keycloak must allow that origin and redirect URIs (see above).
- Storybook on `:6006` is **separate**; do not point Keycloak at Storybook unless you deliberately secure Storybook (unusual for component libraries).

When you add `keycloak-js`, you will:

1. Call `keycloak.init` with **PKCE**.
2. Send users to `keycloak.login()` for protected routes.
3. Use `keycloak.token` / `keycloak.tokenParsed` for API calls and UI display.

---

## Part 7 — Troubleshooting

| Symptom | What to try |
|---------|-------------|
| **Port 8080 in use** | Change host port in `docker-compose.keycloak.yml` or stop the other process. |
| **Admin console never loads** | `docker compose -f docker-compose.keycloak.yml logs -f keycloak` — wait for “started” / listening messages. |
| **Invalid redirect URI** after login | Redirect URI in Keycloak must match the URL your app uses (scheme, host, port, path). |
| **CORS errors** | Set **Web origins** on the client to your SPA origin (e.g. `http://localhost:5173`). |

More Storybook-focused issues: [troubleshooting.md](./troubleshooting.md).

---

## Part 8 — Files in this repo (reference)

| File | Role |
|------|------|
| [docker-compose.keycloak.yml](../docker-compose.keycloak.yml) | Runs Keycloak `start-dev` on port 8080 |
| [.env.keycloak.example](../.env.keycloak.example) | Documents `KEYCLOAK_ADMIN*` variables |
| `.env.keycloak` | Your local admin password (create yourself; gitignored) |

Image tag **26.0.8** is pinned for reproducibility; bump intentionally when you upgrade Keycloak and re-test the SPA.
