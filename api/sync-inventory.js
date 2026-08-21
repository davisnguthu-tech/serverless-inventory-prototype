// NOTE: Vercel Hobby plan limits native cron to once/day (see vercel.json).
// Real 5-minute sync is triggered externally via [cron-job.org / GitHub Actions]
// hitting this endpoint directly. The daily cron above is a fallback only.

/**
 * Vercel Serverless Function: Northstar Retail Inventory Synchronization
 * 
 * Route: GET /api/sync-inventory (or POST /api/sync-inventory)
 * 
 * RESPONSIBILITIES:
 * 1. Fetches current inventory levels from simulated Warehouse API (GET /api/warehouse/inventory).
 * 2. Validates HTTP response status and data payload schema.
 * 3. Formats product items and caches them individually in Redis under `inventory:product:<productId>`.
 * 4. Stores sync metadata in Redis under `inventory:metadata` (lastSyncedAt, productsSynced, status).
 * 5. Returns detailed JSON summary of sync result or explicit failure diagnostics.
 */

const redis = require('../lib/redis');

/**
 * Serverless Request Handler
 * 
 * @param {import('http').IncomingMessage & { query?: Record<string, string> }} req - Incoming HTTP request.
 * @param {import('http').ServerResponse & { json?: Function, status?: Function }} res - Outgoing HTTP response.
 */
module.exports = async function handler(req, res) {
  const sendJsonResponse = (statusCode, payload) => {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(statusCode).json(payload);
    } else {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    }
  };

  const syncTimestamp = new Date().toISOString();

  // Verify Vercel Cron authentication if CRON_SECRET environment variable is configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (authHeader !== `Bearer ${cronSecret}`) {
      return sendJsonResponse(401, {
        status: "ERROR",
        error: "Unauthorized",
        message: "Invalid or missing Authorization header for scheduled cron invocation."
      });
    }
  }

  // Step 1: Query Warehouse Inventory Endpoint
  let warehouseData;
  const host = req.headers && req.headers.host ? req.headers.host : 'localhost:3000';
  const protocol = req.headers && req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'] : 'http';
  const warehouseUrl = `${protocol}://${host}/api/warehouse/inventory`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(warehouseUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Step 2: Validate Warehouse API HTTP Status
    if (!response.ok) {
      return sendJsonResponse(502, {
        status: "ERROR",
        error: "Bad Gateway",
        message: `Warehouse API request failed with HTTP status ${response.status}`,
        endpoint: warehouseUrl
      });
    }

    warehouseData = await response.json();
  } catch (error) {
    return sendJsonResponse(502, {
      status: "ERROR",
      error: "Bad Gateway",
      message: "Warehouse API unavailable or un-reachable.",
      details: error.name === 'AbortError' ? 'Warehouse request timed out after 5000ms' : error.message,
      endpoint: warehouseUrl
    });
  }

  // Step 2 (Cont.): Validate Warehouse Payload Schema
  if (!warehouseData || !Array.isArray(warehouseData.products) || warehouseData.products.length === 0) {
    return sendJsonResponse(502, {
      status: "ERROR",
      error: "Bad Gateway",
      message: "Invalid warehouse response format: missing or empty 'products' array.",
      receivedPayload: warehouseData
    });
  }

  // Step 3 & 4: Store Latest Inventory Products in Redis
  const products = warehouseData.products;
  const keysUpdated = [];

  try {
    for (const item of products) {
      if (!item.productId) continue;
      
      const productId = item.productId.trim().toUpperCase();
      const productKey = `inventory:product:${productId}`;
      
      const cachedProductRecord = {
        productId: productId,
        productName: item.productName || "Unknown Product",
        stock: typeof item.stock === 'number' ? item.stock : 0,
        inStock: typeof item.stock === 'number' && item.stock > 0,
        updatedAt: syncTimestamp
      };

      await redis.set(productKey, cachedProductRecord);
      keysUpdated.push(productKey);
    }

    // Step 5: Store Metadata Record in Redis
    const metadataKey = "inventory:metadata";
    const metadataRecord = {
      lastSyncedAt: syncTimestamp,
      productsSynced: keysUpdated.length,
      status: "SUCCESS",
      warehouse: warehouseData.warehouse || "Northstar Fulfillment Center"
    };

    await redis.set(metadataKey, metadataRecord);
    keysUpdated.push(metadataKey);

  } catch (error) {
    return sendJsonResponse(500, {
      status: "ERROR",
      error: "Internal Server Error",
      message: "Redis cache unavailable or failed to write synchronized inventory records.",
      details: error.message
    });
  }

  // Step 7: Return Successful Sync Summary
  return sendJsonResponse(200, {
    status: "SUCCESS",
    syncedAt: syncTimestamp,
    productsSynced: products.length,
    warehouse: warehouseData.warehouse || "Northstar Fulfillment Center",
    keysUpdated: keysUpdated
  });
};
