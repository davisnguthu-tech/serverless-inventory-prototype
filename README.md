# 🚀 Northstar Retail — Serverless Inventory API Prototype

A minimal, beginner-readable Node.js Serverless Function API built as an independent learning exercise and configured for seamless deployment on **Vercel**.

---

## 🌐 Live Deployment & Endpoints

- **Live Web Interface (Vercel)**: `https://serverless-inventory-prototype.vercel.app`
- **Live Inventory API Endpoint**: `https://serverless-inventory-prototype.vercel.app/api/inventory?productId=PROD-101`
- **Live Health Check Endpoint**: `https://serverless-inventory-prototype.vercel.app/api/health`

---

## 📚 1. What is a Serverless Function?

A **Serverless Function** (often called *Function-as-a-Service* or *FaaS*) is an execution model where code runs on-demand in response to events or HTTP requests, without requiring developer management or continuous provisioning of a persistent server.

### Key Concepts:
- **On-Demand Execution**: Unlike traditional Node.js servers (such as Express apps running `server.listen(3000)` 24/7), a serverless function provisions on-demand when a request arrives, handles the request, sends an HTTP response, and goes idle or shuts down.
- **Serverless Scaling Nuance**: Serverless platforms automatically scale execution to handle incoming traffic bursts. However, **10,000 requests do NOT automatically equal 10,000 separate function container instances**. Cloud providers (like Vercel and AWS Lambda) reuse "warm" function instances across sequential requests and enforce platform concurrency limits and quotas.
- **Zero Server Infrastructure Management**: Operating system patches, SSL provisioning, process managers (e.g., PM2), and reverse proxies (e.g., Nginx) are managed automatically by the serverless platform.
- **Statelessness**: Serverless execution environments are ephemeral. Memory state is not guaranteed to persist across different invocations or separate instances.

---

## 🏗️ 2. Architecture & How It Works

```
                               ┌─────────────────────────┐
                               │  Web Browser / Client   │
                               └────────────┬────────────┘
                                            │
                               HTTP GET /api/inventory?productId=PROD-101
                               HTTP GET /api/health
                                            │
             ┌──────────────────────────────┴──────────────────────────────┐
             │                                                             │
   [Local Development Mode]                                      [Production Mode]
       node dev.js (Port 3000)                                Vercel FaaS Edge Network
             │                                                             │
  ┌──────────┴──────────┐                                       ┌──────────┴──────────┐
  │ Routes HTTP calls & │                                       │ Automatically maps  │
  │ serves static UI    │                                       │ /api/*.js routes    │
  └──────────┬──────────┘                                       └──────────┬──────────┘
             │                                                             │
             └──────────────────────────────┬──────────────────────────────┘
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      │                                           │
             api/inventory.js                              api/health.js
                      │                                           │
          Validates query parameter                     Returns service status &
          & queries MOCK_INVENTORY                      ISO 8601 timestamp
```

### Serverless Functions vs Local Helper (`dev.js`):
- **`api/inventory.js` & `api/health.js`**: These are the actual **Vercel Serverless Functions**. When deployed to Vercel, Vercel automatically exposes files inside the `/api` directory as individual serverless endpoints (`/api/inventory` and `/api/health`).
- **`dev.js`**: This file is **only a local development/testing helper script**. It uses Node.js's native `http` module to serve `public/index.html` and route `/api/*` calls locally during development so you do not need to install global CLI tools.

---

## 🛠️ 3. How to Run It Locally

### Using the Zero-Dependency Local Development Server

```bash
# Navigate to project directory
cd serverless-inventory-prototype

# Start local dev server
npm run dev
```

Open your browser at `http://localhost:3000` to interact with the web dashboard.

---

## 🧪 4. How to Test the Endpoints

### 1. Inventory Endpoint (`GET /api/inventory`)

| Test Scenario | Query Parameter | Expected HTTP Status | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **In-Stock Product** | `?productId=PROD-101` | `HTTP 200 OK` | Returns product details with `stock: 45` and `inStock: true`. |
| **Out-of-Stock Product** | `?productId=PROD-103` | `HTTP 200 OK` | Returns product details with `stock: 0` and `inStock: false`. |
| **Invalid Product** | `?productId=PROD-999` | `HTTP 404 Not Found` | Returns error message & list of available IDs. |
| **Missing Parameter** | *(no parameter)* | `HTTP 400 Bad Request` | Returns error message indicating `productId` is required. |

#### Example `curl` Commands:
```bash
# Valid product lookup
curl -i "http://localhost:3000/api/inventory?productId=PROD-101"

# Out-of-stock product lookup
curl -i "http://localhost:3000/api/inventory?productId=PROD-103"

# Non-existent product lookup
curl -i "http://localhost:3000/api/inventory?productId=PROD-999"

# Missing parameter lookup
curl -i "http://localhost:3000/api/inventory"
```

### 2. Health Check Endpoint (`GET /api/health`)

```bash
curl -i "http://localhost:3000/api/health"
```

**Response (`HTTP 200 OK`)**:
```json
{
  "status": "ok",
  "service": "northstar-serverless-inventory",
  "timestamp": "2026-08-20T13:00:00.000Z"
}
```

---

## 🔒 5. Prototype Limitations

This project is a lightweight learning prototype and has intentional limitations:
1. **Mock Inventory Data**: Uses an in-memory JavaScript object (`MOCK_INVENTORY`) inside `api/inventory.js`. Data is intentionally hardcoded for educational purposes without database connectivity.
2. **No Persistent State**: Any changes to state in memory are ephemeral and reset when function containers recycle.
3. **No Authentication or Authorization**: Endpoints are publicly accessible without API keys or JWT tokens.
4. **No Rate Limiting**: Does not throttle high-frequency client requests.

---

## 🔮 6. Future Improvements

To elevate this prototype to a production-ready microservice, future iterations could implement:
- **Managed Database Integration**: Connect to a serverless database (e.g., PostgreSQL via Supabase/Neon, or Redis via Upstash) for dynamic stock updates.
- **Authentication & Security**: Add API key validation or OAuth2/JWT middleware.
- **Rate Limiting**: Protect endpoints against abuse using Redis-backed rate limiting.
- **Observability**: Implement structured logging, distributed tracing (OpenTelemetry), and health metrics dashboard.
- **Automated CI/CD**: Set up automated unit/integration testing on GitHub Pull Requests before deploying to Vercel.

---

## 📁 File Breakdown

| File | Description | Purpose |
| :--- | :--- | :--- |
| `api/inventory.js` | **Serverless Function Handler** | Handles `/api/inventory` requests, validates input, checks mock catalog, and returns HTTP 200/400/404 responses. |
| `api/health.js` | **Serverless Function Handler** | Handles `/api/health` requests and returns service health status and timestamp. |
| `public/index.html` | **Web UI** | Interactive browser frontend demonstrating the API, request viewer, status code badges, and formatted JSON output. |
| `dev.js` | **Local Runner** | Lightweight local Node.js server simulating Vercel's route handling for local offline testing. |
| `package.json` | **Project Config** | Defines project scripts (`npm run dev`) and project metadata. |
| `README.md` | **Documentation** | Architectural guide and documentation for the learning prototype. |
