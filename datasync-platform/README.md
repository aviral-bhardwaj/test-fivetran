# DataSync Platform ⚡

A modern, high-performance data integration platform inspired by **Fivetran**, built from the ground up with **Node.js, Express, and React**.

DataSync automates extracting data from various source connectors (PostgreSQL, MySQL, CSV, Built-in Demo Store), orchestrates full and incremental ETL syncs with automatic cursor management, and loads data reliably into target destinations (Local Files, SQLite Data Warehouse).

---

## 🚀 Key Features

- **⚡ End-to-End Data Pipeline**: Complete workflow from source connector configuration, schema discovery, pipeline mapping, background job queuing, extraction, and loading.
- **📊 Real-time Dashboard**:
  - Live metric cards (Total Syncs, Succeeded, Failed, Running, Rows Synced, Active Connections)
  - 7-day sync history chart using Recharts
  - Recent sync activity table with status badges and execution metrics
- **🔌 Pluggable Source Connectors**:
  - **Demo Source**: Built-in realistic sample data (Users, Orders, Products) for instant zero-dependency testing
  - **PostgreSQL Connector**: Parameterized SQL extraction & schema inspection
  - **MySQL Connector**: MySQL driver integration
  - **CSV File Connector**: File ingestion & schema auto-detection
- **📦 Data Destinations**:
  - **SQLite Warehouse**: Automatically generates database tables and appends/updates records
  - **Local File Warehouse**: Streams JSONL sync archives to disk
- **🔄 Sync Engine & Worker**:
  - Asynchronous worker loop with automated retries and error tracking
  - **Full Sync** & **Incremental Sync** modes (with automated cursor tracking)
  - Schema discovery endpoint inspection
  - Automated cron scheduler for scheduled pipeline runs
- **🎨 Modern React UI**:
  - Built with **React 19**, **Vite**, **Tailwind CSS**, and **Lucide React**
  - Dark slate navigation sidebar with active indicator
  - Responsive tables, modals, toast notification system
  - Dedicated Connection Detail view with schema viewer, sync history timeline, and configuration inspect

---

## 🛠️ Tech Stack

### Backend
- **Node.js & Express 5**: Robust REST API & static SPA server
- **better-sqlite3**: High-performance SQLite engine with WAL mode
- **node-cron**: Scheduled sync execution
- **Joi**: Strict request validation
- **Morgan & CORS**: Logging and security middleware

### Frontend
- **React 19 & React Router 7**: Single Page Application architecture
- **Vite 6**: Fast build tooling and hot-reloading dev server
- **Tailwind CSS 3**: Modern utility-first styling
- **Recharts**: Data visualization & sync history trends
- **Lucide React**: Modern iconography
- **Axios**: HTTP API client with polling hooks

---

## 📁 Repository Structure

```
datasync-platform/
├── backend/
│   ├── src/
│   │   ├── index.js               # Express entrypoint & SPA static server
│   │   ├── config.js              # Environment configuration
│   │   ├── db/
│   │   │   └── connection.js      # SQLite initialization & schema migrations
│   │   ├── routes/                # REST endpoints
│   │   │   ├── organizations.js
│   │   │   ├── connectors.js
│   │   │   ├── destinations.js
│   │   │   ├── connections.js
│   │   │   ├── syncs.js
│   │   │   └── metrics.js
│   │   ├── connectors/            # Source connector implementations
│   │   │   ├── base.js
│   │   │   ├── demo.js
│   │   │   ├── postgres.js
│   │   │   ├── mysql.js
│   │   │   └── csv.js
│   │   ├── destinations/          # Target destination implementations
│   │   │   ├── base.js
│   │   │   ├── localFile.js
│   │   │   └── sqliteWarehouse.js
│   │   ├── services/              # Engine services
│   │   │   ├── schemaService.js
│   │   │   ├── syncEngine.js
│   │   │   └── schedulerService.js
│   │   ├── workers/
│   │   │   └── syncWorker.js      # Background job polling loop
│   │   └── middleware/
│   │       ├── errorHandler.js
│   │       └── validate.js
│   └── tests/
│       └── integration.test.js    # Comprehensive API test suite
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Layout & route configuration
│   │   ├── api/client.js          # Axios API client
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Layout/
│   │   │   ├── DataTable.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── ToastContainer.jsx
│   │   ├── hooks/                 # Custom hooks (polling, toasts)
│   │   └── pages/                 # Full view pages
│   │       ├── Dashboard.jsx
│   │       ├── Connectors.jsx
│   │       ├── Destinations.jsx
│   │       ├── Connections.jsx
│   │       ├── ConnectionDetail.jsx
│   │       ├── SyncHistory.jsx
│   │       └── Settings.jsx
│   ├── index.html
│   └── vite.config.js
├── package.json
└── README.md
```

---

## 🏁 Quickstart

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run the Platform
To run both backend API (port 4000) and frontend Vite dev server (port 5173):
```bash
npm run dev
```

Or run the built production platform directly on a single port:
```bash
cd frontend && npm run build
node backend/src/index.js
```
Open **http://localhost:4000** in your browser.

### 3. Run Automated Tests
```bash
npm test
```

---

## 🧪 Testing the Pipeline Out of the Box

1. Open **http://localhost:4000** in your browser.
2. Go to **Settings** and click **"Create Demo Setup"** to provision a demo source, destination, and connection in 1 click, or:
   - Create a connector with Type **Demo** (`demo_users`, `demo_orders`, `demo_products`).
   - Create a destination with Type **Local File** (`./data/syncs`) or **SQLite Warehouse** (`./data/warehouse.db`).
   - Create a connection linking the source and destination.
3. Click **"Sync Now"**.
4. The background worker picks up the job, extracts records, updates the destination, persists sync metrics, and records cursor state.
5. Inspect the Dashboard or Sync History to view row counts, execution duration, and schema definitions.

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health and uptime |
| `GET` | `/api/metrics` | Aggregated sync stats and counters |
| `GET/POST` | `/api/organizations` | List / create organizations |
| `GET/POST` | `/api/connectors` | List / create source connectors |
| `POST` | `/api/connectors/:id/test` | Test source connection |
| `GET/POST` | `/api/destinations` | List / create destinations |
| `GET/POST` | `/api/connections` | List / create pipeline connections |
| `POST` | `/api/connections/:id/discover` | Discover source schema |
| `POST` | `/api/connections/:id/sync` | Trigger sync execution |
| `POST` | `/api/connections/:id/toggle` | Enable or disable connection |
| `GET` | `/api/syncs` | List all historical sync jobs |
