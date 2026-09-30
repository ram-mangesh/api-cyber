# API Cyber

**Security posture dashboard for the Dronikastra API vulnerability scanner.**

A React single-page application that talks to a Dronikastra scanner appliance over its
REST API. It lets a security team register scan targets, launch and watch scans, triage
findings, follow attack paths, file issues, and pull reports — plus an optional Twilio
voice call that phones an on-call engineer the moment new critical findings appear.

---

## Table of contents

- [Name and description](#name-and-description)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture and flow](#architecture-and-flow)
- [File structure](#file-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API surface](#api-surface)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Name and description

| | |
|---|---|
| **Repository** | `ram-mangesh/api-cyber` |
| **Package name** | `api-cyber` |
| **Display name** | API Cyber — Dronikastra Security Dashboard |
| **Type** | Frontend SPA + thin Node/Express static-and-proxy server |
| **Primary purpose** | Operate and triage a Dronikastra API security scanner from a browser |

The scanner itself is **not** part of this repository. This is the operator-facing
control plane: the UI plus the small Express server that hosts the built assets and
proxies API calls to the scanner.

### Why a proxy is needed

The scanner appliance frequently runs on a private network over HTTPS with a
self-signed certificate. A browser cannot talk to it directly because of CORS and
certificate validation. So every API call is funnelled through a server-side
`/dynamic-proxy` route that reads the intended destination from a request header,
forwards the call, and strips the prefix before the request lands upstream. This
works identically in the Vite dev server and in the production Express server, so
there is only one code path to reason about.

---

## Features

**Targets and scanning**
- Register, edit, group, and bulk-delete scan targets
- Per-target configuration: exclusions, allowed hosts, technologies, continuous scan
  schedules, login sequences, and sensor reset
- Start, abort, resume, and inspect scans; browse crawl data and per-result statistics

**Findings**
- Vulnerability list with severity filtering and bulk re-check
- Vulnerability detail view with raw HTTP request/response exchange, including
  Base64-encoded exchanges which are decoded for display
- Attack-path visualisation
- Vulnerability type and group catalogue

**Reporting and integrations**
- Report generation, templates, repeat runs, and download
- Scheduled data exports and CSV export
- Issue tracker integrations (connection test, project discovery, custom field mapping)
- WAF inventory and connectivity checks

**Operations**
- Worker/agent authorisation, health checks, upgrade, and rename
- Excluded-hours profiles for scan windows
- User, user group, and role/permission management
- Light/dark theming

**Alerting**
- Optional Twilio neural-voice call when new critical or high findings are detected,
  speaking the live count and severity, with a keypad menu to triage from the phone

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, React Router 7 |
| Build | Vite 8, `@vitejs/plugin-react` |
| Styling | Tailwind CSS 4, plain CSS |
| Charts | Recharts |
| Icons | lucide-react |
| HTTP | Axios |
| Server | Express 5, `http-proxy-middleware` |
| Tunnel | localtunnel (for sharing a local dev build) |
| Lint | oxlint |
| Language | JavaScript (ESM), JSX |

---

## Architecture and flow

### Component tree

```
main.jsx
  └─ App.jsx
       ├─ ThemeProvider        light/dark tokens
       ├─ ApiProvider          base URL + API key, persisted to localStorage
       ├─ AuthProvider         session flag, persisted to localStorage
       └─ BrowserRouter
            ├─ PublicRoute ──> Landing, Login
            └─ ProtectedRoute
                 └─ Layout (Sidebar + Topbar)
                      └─ the 20 dashboard pages
```

### An API call, end to end

```
  Page component              (e.g. Targets.jsx)
        |  const api = useApiClient()
        v
  useApiClient.js              memoised Axios instance + 15 resource groups
        |
        v
  api/client.js                targetsApi(client).getAll({ page })
        |  baseURL = /dynamic-proxy/api/v1
        |  headers = { x-target-base-url: <scanner>, X-Auth: <api key> }
        v
  /dynamic-proxy               Vite middleware (dev) or Express middleware (prod)
        |  reads x-target-base-url
        |  pathRewrite strips the /dynamic-proxy prefix
        |  secure:false  -> accepts the scanner's self-signed cert
        |  removes the x-target-base-url header before forwarding
        v
  Dronikastra scanner          https://<scanner-host>:3443/api/v1/targets
        |
        v
  response  ──> page state ──> re-render
```

### Where configuration comes from

Values resolve in this order, and once the user saves them in the app they win:

1. `localStorage` — written by the **Settings** page (`saveConfig`)
2. `.env` — first-run defaults, read at build time via `import.meta.env`
3. Empty — the page renders an unconfigured state rather than guessing

### The critical-finding alert path

```
  Dashboard.jsx  load()
        |  pulls the newest scan results
        |  counts severity in {critical, high}, tracks the max severity
        v
  newly-seen criticals?  (localStorage: alerted_critical_vulns, so each vuln alerts once)
        |
        v
  utils/twilioAlert.js  triggerTwilioCall(count, severity)
        |  bails out unless all four VITE_TWILIO_* values are set
        |  builds TwiML with the live count and severity
        |  hosts the XML through the public Twimlets echo service to get a URL
        v
  POST /twilio/2010-04-01/Accounts/{SID}/Calls.json
        |  (dev: Vite proxy to api.twilio.com; prod: same prefix served by Express)
        v
  Twilio places the call ──> engineer picks 1-4 ──> POSTed to the configured gather URL
```

### Dev vs. production

| | `npm run dev` | `npm run build && npm start` |
|---|---|---|
| Assets | Vite dev server, HMR disabled | Static `dist/` served by Express |
| `/dynamic-proxy` | `vite.config.js` middleware | `server.js` middleware |
| `/twilio` | Vite proxy to `api.twilio.com` | not proxied — needs a matching route |
| Port | 5173 | `PORT` or 8080 |
| Reachable from | localhost, or a localtunnel URL | wherever you deploy it |

---

## File structure

```
api-cyber/
├── .env.example              # template for every variable below; copy to .env
├── .gitignore                # ignores .env, node_modules, dist, localtunnel output
├── .oxlintrc.json            # lint config
├── index.html                # Vite entry document
├── package.json
├── package-lock.json
├── vite.config.js            # dev server, dynamic-proxy middleware, /twilio proxy
├── server.js                 # production: serves dist/ + same dynamic proxy
├── lt-script.cjs             # opens a localtunnel to the dev server, prints the URL
├── test_twilio.cjs           # standalone Twilio smoke test, reads process.env
├── README.md
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
└── src/
    ├── main.jsx              # React root
    ├── App.jsx               # providers + all routes
    ├── App.css
    ├── index.css             # Tailwind entry
    │
    ├── api/
    │   └── client.js         # Axios factory + every resource endpoint map
    │
    ├── components/
    │   └── layout/
    │       ├── Layout.jsx    # authenticated shell
    │       ├── Sidebar.jsx   # navigation
    │       └── Topbar.jsx    # header, user menu
    │
    ├── context/
    │   ├── ApiContext.jsx    # base URL + API key, useApi()
    │   ├── AuthContext.jsx   # login state, useAuth()
    │   └── ThemeContext.jsx  # light/dark tokens, useTheme()
    │
    ├── hooks/
    │   └── useApiClient.js   # memoised client + grouped resource API
    │
    ├── utils/
    │   ├── httpExchange.js   # split/format raw HTTP request & response
    │   └── twilioAlert.js    # TwiML build + call dispatch
    │
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    │
    └── pages/
        ├── Landing.jsx            # public marketing / entry page
        ├── Login.jsx              # public credential prompt
        ├── Dashboard.jsx          # KPIs, charts, critical-finding alert hook
        ├── AttackPaths.jsx
        ├── Targets.jsx
        ├── TargetConfig.jsx       # per-target configuration
        ├── TargetGroups.jsx
        ├── Scans.jsx
        ├── ScanDetail.jsx         # crawl data, results, statistics
        ├── ScanProfiles.jsx
        ├── Vulnerabilities.jsx
        ├── VulnDetail.jsx         # detail + HTTP exchange viewer
        ├── Reports.jsx
        ├── Exports.jsx
        ├── IssueTrackers.jsx
        ├── WAFs.jsx
        ├── Workers.jsx
        ├── ExcludedHours.jsx
        ├── Users.jsx
        ├── UserGroups.jsx
        ├── Roles.jsx
        └── Settings.jsx           # base URL + API key editor
```

---

## Getting started

### Requirements

- Node.js 20 or newer
- npm
- Reachable Dronikastra scanner and an API key for it

### Install

```bash
git clone https://github.com/ram-mangesh/api-cyber.git
cd api-cyber
npm install
```

### Configure

```bash
cp .env.example .env      # Windows PowerShell: copy .env.example .env
```

At minimum set the scanner URL and key — the app is unusable without them:

```ini
VITE_API_BASE_URL=https://your-scanner-host:3443
VITE_DRONIKASTRA_API_KEY=your-key
```

Set `VITE_DASHBOARD_USERNAME` and `VITE_DASHBOARD_PASSWORD` too, otherwise login
rejects every attempt by design. Twilio variables are optional; alerting stays off
until all four `VITE_TWILIO_*` values are present.

You can also leave `.env` mostly empty and set everything from the **Settings**
page at runtime — those values persist in `localStorage`.

### Run in development

```bash
npm run dev
```

Open http://localhost:5173. To reach it from another machine, run `node lt-script.cjs`
in a second terminal and open the URL it prints.

### Build and serve

```bash
npm run build
npm start
```

Serves `dist/` plus the proxy on port 8080, or on `$env:PORT` if set.

---

## Environment variables

All variables are read at **build** time for the browser bundle. Changing a `VITE_*`
value requires a rebuild, or an edit through the Settings page which is stored in
`localStorage` and takes effect immediately.

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | yes | Scanner base URL, no trailing slash. Also the dev-proxy fallback target. |
| `VITE_DRONIKASTRA_API_KEY` | yes | Sent as the `X-Auth` header. |
| `VITE_DASHBOARD_USERNAME` | for login | Accepted username. Empty disables login. |
| `VITE_DASHBOARD_PASSWORD` | for login | Accepted password. Empty disables login. |
| `VITE_TWILIO_ACCOUNT_SID` | for alerts | Twilio account SID. |
| `VITE_TWILIO_AUTH_TOKEN` | for alerts | Twilio auth token. |
| `VITE_TWILIO_TO_NUMBER` | for alerts | Number that receives the call. |
| `VITE_TWILIO_FROM_NUMBER` | for alerts | Twilio number that places it. |
| `VITE_TWILIO_GATHER_ACTION_URL` | no | Public URL that receives the 1-4 keypad press. |
| `PORT` | no | Production server port. Default `8080`. |

`.env` is gitignored. `.env.example` is committed and holds placeholders only.

---

## Available scripts

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server with the dynamic proxy |
| `npm run build` | Production bundle into `dist/` |
| `npm start` | Serve `dist/` and the dynamic proxy from Node |
| `npm run preview` | Serve the built bundle through Vite |
| `npm run lint` | oxlint over the project |
| `npm run test:twilio` | Place a real test call using the env values |

---

## API surface

Every call goes to `<scanner>/api/v1/...` through the proxy. `src/api/client.js` is
the single source of truth; grouped by resource:

`targets`, `target_groups`, `scans`, `scanning_profiles`, `vulnerabilities`,
`vulnerability_types`, `vulnerability_groups`, `reports`, `report_templates`,
`export_types`, `exports`, `users`, `user_groups`, `roles`, `issue_trackers`,
`wafs`, `workers`, `excluded_hours_profiles`, `config/agents`.

Notable shapes:

- `GET /scans/:id/results/:resultId/crawldata` answers `302` without a `q`
  parameter, so the client reads the root's children instead
- `.../vulnerabilities/:vulnId/http_response` returns raw text, not JSON, and is
  requested with `responseType: 'text'`
- `GET /targets/cvs_export` returns a blob

---

## Security notes

Read this before exposing the dashboard beyond your own machine.

**Secrets belong in `.env`, never in the source.** The Twilio credentials, phone
numbers, scanner API key, and dashboard password were all hardcoded when this
project was first written. They now live only in `.env` / `localStorage`. If you
ever committed them, rotating the credentials is the only real fix — deleting the
lines does not remove them from git history.

**Client-side auth is not a security boundary.** `AuthContext` compares credentials
in the browser and stores a boolean in `localStorage`. Anyone with devtools can read
the flag or the stored API key. Treat the dashboard as an internal tool and put real
authentication in front of it before sharing it.

**Everything prefixed `VITE_` is public.** Vite inlines those values into the
JavaScript bundle. `VITE_TWILIO_AUTH_TOKEN` and `VITE_DRONIKASTRA_API_KEY` are
therefore readable by anyone who can load the page. This is acceptable only for a
trusted network; for anything wider, move the Twilio call and the API key behind the
Express server and keep them in server-side environment variables that are never
given a `VITE_` prefix.

**`/dynamic-proxy` is an open forward proxy by design.** It will relay to any host
named in `x-target-base-url`, and `secure: false` disables certificate verification
so self-signed scanners work. Combined with `server.allowedHosts: true`, that means
anyone who can reach the server can make it issue requests to arbitrary hosts,
including internal ones. Do not run the production server on a public interface.

**`npm run test:twilio` places a real call** and bills your Twilio account.

---

## Troubleshooting

**Login always fails** — `VITE_DASHBOARD_USERNAME` / `VITE_DASHBOARD_PASSWORD` are
empty, or you changed them after a build. Re-set them and rebuild, or configure
from the Settings page.

**All API calls fail with a network or CORS error** — the browser is bypassing the
proxy. Confirm requests go to `/dynamic-proxy/api/v1/...` and not straight to the
scanner host, and that `VITE_API_BASE_URL` is reachable from the machine serving the
app.

**`Missing x-target-base-url header`** — the request never set the header, which
means `baseUrl` is empty. Set it in Settings or `.env`.

**SSL errors from the scanner** — expected. `secure: false` handles it in both
servers. If you hit one in a browser, that request is not going through the proxy.

**The Twilio call never happens** — alerting needs all four `VITE_TWILIO_*` values.
`Dashboard.jsx` also tracks which vulnerability IDs have already alerted in
`localStorage`, so a known finding will not re-alert. Clear
`alerted_critical_vulns` to test again.

**Localtunnel URL will not load** — `allowedHosts` is enabled, but localtunnel is
rate-limited and its hostnames are often blocked by ad blockers. The Vite server must
be running in another terminal.
