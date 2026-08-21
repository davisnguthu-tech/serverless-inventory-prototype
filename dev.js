/**
 * Local Development Server for Vercel Serverless Function Prototype
 * 
 * Runs a lightweight Node.js HTTP server locally so you can test `/api/inventory`
 * and view the web interface without installing external CLI tools.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const inventoryHandler = require('./api/inventory');
const healthHandler = require('./api/health');
const warehouseInventoryHandler = require('./api/warehouse/inventory');
const syncInventoryHandler = require('./api/sync-inventory');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Route: Serverless Function /api/inventory
  if (pathname === '/api/inventory') {
    // Populate req.query like Vercel serverless environment does
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    return inventoryHandler(req, res);
  }

  // Route: Serverless Function /api/health
  if (pathname === '/api/health') {
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    return healthHandler(req, res);
  }

  // Route: Serverless Function /api/warehouse/inventory
  if (pathname === '/api/warehouse/inventory') {
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    return warehouseInventoryHandler(req, res);
  }

  // Route: Serverless Function /api/sync-inventory
  if (pathname === '/api/sync-inventory') {
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    return syncInventoryHandler(req, res);
  }

  // Route: Static file serving for testing frontend (public/index.html)
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Page Not Found" }));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json'
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Northstar Serverless Prototype running locally!`);
  console.log(`📡 Local Server URL : http://localhost:${PORT}`);
  console.log(`⚡ Inventory Endpoint : http://localhost:${PORT}/api/inventory?productId=PROD-101`);
  console.log(`💓 Health Check Endpoint : http://localhost:${PORT}/api/health`);
  console.log(`🏭 Warehouse Inventory Endpoint : http://localhost:${PORT}/api/warehouse/inventory`);
  console.log(`🔄 Sync Inventory Endpoint : http://localhost:${PORT}/api/sync-inventory\n`);
});
