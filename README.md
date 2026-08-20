# 🚀 Northstar Retail — Serverless Inventory Function Prototype

A minimal, beginner-readable Node.js Serverless Function project created as an independent learning exercise and ready for deployment on **Vercel**.

---

## 📚 1. What is a Serverless Function?

A **Serverless Function** (often called *Function-as-a-Service* or *FaaS*) is a execution model where code runs on-demand in response to events or HTTP requests, without requiring you to manage, provision, or maintain a persistent server.

### Key Concepts:
- **On-Demand Execution**: Unlike traditional Node.js/Express servers that run `server.listen(3000)` continuously 24/7, a serverless function spins up when a request arrives, handles the request, sends a response, and immediately shuts down or goes idle.
- **Automatic Scaling**: If 1 request arrives, Vercel executes 1 instance of your function. Serverless platforms can automatically scale function execution to handle increased traffic, subject to the platform's limits, quotas and concurrency behaviour.
- **Zero Server Management**: You don't need to configure Nginx, SSL certificates, operating system updates, or process managers like PM2.
- **Statelessness**: Serverless functions are ephemeral. In-memory data does not persist permanently between requests across different function instances.

---

## 🛠️ 2. How This Prototype Works

This project models an inventory lookup system for **Northstar Retail**:

1. **Routing Convention**: Vercel maps any file in the `/api` directory to an HTTP endpoint. 
   - `api/inventory.js` -> Hosted at `/api/inventory`
2. **Function Handler**: The function exports a default handler function `module.exports = function handler(req, res)`.
3. **Mock Data**: Uses an in-memory inventory dataset (`MOCK_INVENTORY`) containing product names, stock quantities, and availability states.
4. **Validation & HTTP Status Codes**:
   - **`HTTP 200 OK`**: Product found. Returns `productId`, `productName`, `stock`, and boolean `inStock`.
   - **`HTTP 400 Bad Request`**: `productId` parameter is missing from the query string.
   - **`HTTP 404 Not Found`**: `productId` does not exist in the inventory catalog.

---

## 💻 3. How to Run It Locally

You can run and test this project locally in two ways:

### Option A: Using the Built-in Zero-Dependency Local Server (Recommended for instant testing)

No external CLI or dependencies required!

```bash
# Navigate to project directory
cd serverless-inventory-prototype

# Start local server
npm run dev
```

Open your browser at `http://localhost:3000` to view the interactive test interface.

### Option B: Using Vercel CLI (Official Vercel Local Environment)

If you have the Vercel CLI installed globally (`npm i -g vercel`):

```bash
npx vercel dev
```

---

## 🧪 4. How to Test the Endpoint

### Method 1: Using your Browser

Open the following URLs directly in your web browser:

1. **Valid Product Lookup (`HTTP 200`)**:
   `http://localhost:3000/api/inventory?productId=PROD-101`
   
   **Response (`HTTP 200 OK`)**:
   ```json
   {
     "productId": "PROD-101",
     "productName": "Northstar Wireless Ergonomic Mouse",
     "stock": 45,
     "inStock": true
   }
   ```

2. **Out of Stock Product (`HTTP 200`)**:
   `http://localhost:3000/api/inventory?productId=PROD-103`
   
   **Response (`HTTP 200 OK`)**:
   ```json
   {
     "productId": "PROD-103",
     "productName": "Northstar 27-inch 4K USB-C Monitor",
     "stock": 0,
     "inStock": false
   }
   ```

3. **Invalid Product Lookup (`HTTP 404`)**:
   `http://localhost:3000/api/inventory?productId=PROD-999`
   
   **Response (`HTTP 404 Not Found`)**:
   ```json
   {
     "error": "Not Found",
     "message": "Product with ID 'PROD-999' does not exist in inventory.",
     "availableProductIds": ["PROD-101", "PROD-102", "PROD-103", "PROD-104", "PROD-105"]
   }
   ```

4. **Missing Parameter (`HTTP 400`)**:
   `http://localhost:3000/api/inventory`
   
   **Response (`HTTP 400 Bad Request`)**:
   ```json
   {
     "error": "Bad Request",
     "message": "Missing required query parameter: 'productId'",
     "exampleUsage": "/api/inventory?productId=PROD-101"
   }
   ```

### Method 2: Using `curl` (Terminal)

```bash
curl -i "http://localhost:3000/api/inventory?productId=PROD-101"
curl -i "http://localhost:3000/api/inventory?productId=PROD-999"
curl -i "http://localhost:3000/api/inventory"
```

---

## 🌐 5. How to Deploy to Vercel

Deploying this serverless function to Vercel is fast and free.

### Approach 1: Deploy via Vercel CLI

1. Open your terminal in `serverless-inventory-prototype`.
2. Run:
   ```bash
   npx vercel
   ```
3. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your personal scope.
   - Link to existing project? **No**
   - Project name? Press Enter or type `northstar-inventory-api`
   - Directory located at? `./`
4. Vercel will output a live production URL (e.g. `https://northstar-inventory-api.vercel.app`).
5. Your endpoint will instantly be live at `https://your-app.vercel.app/api/inventory?productId=PROD-101`!

### Approach 2: Deploy via GitHub & Vercel Dashboard

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import your GitHub repository.
4. Keep the default settings and click **Deploy**.
5. Vercel will automatically build the static assets in `/public` and deploy `/api/inventory.js` as a serverless function!

---

## 📁 File Breakdown & Architecture

| File | Purpose | Why It Is Needed |
| :--- | :--- | :--- |
| `api/inventory.js` | **Serverless Function Handler** | The core logic. Vercel automatically exposes files in `api/` as serverless HTTP endpoints. Handles parameter parsing, validation, HTTP status code assignment, and JSON formatting. |
| `public/index.html` | **Interactive Test UI** | A clean visual dashboard to test all API responses directly in your browser. |
| `dev.js` | **Local Development Runner** | Simulates Vercel's execution environment locally so you can run `npm run dev` without needing CLI setup. |
| `package.json` | **Project Config & Scripts** | Standard Node.js manifest defining project scripts and metadata. |
| `README.md` | **Documentation & Learning Guide** | Comprehensive explanation of serverless concepts, local testing workflows, and Vercel deployment. |
