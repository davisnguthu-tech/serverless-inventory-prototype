/**
 * Vercel Serverless Function: Northstar Retail Inventory Lookup
 * 
 * SERVERLESS ENTRY POINT EXPLANATION:
 * - In Vercel, any JavaScript/Node.js file placed inside the `/api` directory 
 *   automatically becomes a serverless function endpoint.
 * - The file path `api/inventory.js` maps directly to the URL route `/api/inventory`.
 * - Vercel invokes this exported function every time an incoming HTTP request arrives.
 * - Unlike traditional servers (like Express apps that listen continuously on a port), 
 *   this function spins up on-demand to handle the request, sends the response, 
 *   and shuts down or pauses automatically.
 */

const redis = require('../lib/redis');

// DEPRECATED - pending removal after Redis verification
// In-memory mock dataset representing Northstar Retail's stock catalog.
/*
const MOCK_INVENTORY = {
  "PROD-101": { productName: "Northstar Wireless Ergonomic Mouse", stock: 45 },
  "PROD-102": { productName: "Northstar Mechanical RGB Keyboard", stock: 12 },
  "PROD-103": { productName: "Northstar 27-inch 4K USB-C Monitor", stock: 0 },
  "PROD-104": { productName: "Northstar Multi-Port Thunderbolt Hub", stock: 89 },
  "PROD-105": { productName: "Northstar Active Noise-Canceling Headset", stock: 5 }
};
*/

/**
 * Serverless Request Handler
 * 
 * @param {import('http').IncomingMessage & { query?: Record<string, string> }} req - The incoming HTTP request object.
 * @param {import('http').ServerResponse & { json?: Function, status?: Function }} res - The outgoing HTTP response object.
 */
module.exports = async function handler(req, res) {
  // Helper to ensure JSON responses work in both Vercel and standard Node.js environments
  const sendJsonResponse = (statusCode, payload) => {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      // Vercel serverless helper methods
      res.status(statusCode).json(payload);
    } else {
      // Standard Node.js HTTP ServerResponse fallback
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    }
  };

  // 1. Extract query parameters from request
  // Vercel automatically populates req.query. Fallback to parsing URL if needed.
  let queryParams = req.query;
  if (!queryParams) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    queryParams = Object.fromEntries(url.searchParams.entries());
  }

  const { productId } = queryParams;

  // 2. Validate requirement: HTTP 400 if productId parameter is missing
  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    return sendJsonResponse(400, {
      error: "Bad Request",
      message: "Missing required query parameter: 'productId'",
      exampleUsage: "/api/inventory?productId=PROD-101"
    });
  }

  const sanitizedId = productId.trim().toUpperCase();

  // 3. Lookup item in the Redis cache store
  let cachedProduct;
  try {
    const productKey = `inventory:product:${sanitizedId}`;
    cachedProduct = await redis.get(productKey);
  } catch (error) {
    // 4. Requirement: HTTP 503 if Redis connection fails or is unreachable
    return sendJsonResponse(503, {
      error: "Service Unavailable",
      message: "Redis cache connection failed or is unreachable.",
      details: error.message
    });
  }

  // 5. Validate requirement: HTTP 404 if product does not exist in Redis cache
  if (!cachedProduct) {
    return sendJsonResponse(404, {
      error: "Not Found",
      message: `Product with ID '${sanitizedId}' does not exist in inventory cache.`
    });
  }

  // Parse cached product record if stringified
  const productData = typeof cachedProduct === 'string' ? JSON.parse(cachedProduct) : cachedProduct;
  const stockQty = typeof productData.stock === 'number' ? productData.stock : 0;

  // 6. Build and return successful response: HTTP 200 with required attributes
  const responseData = {
    productId: productData.productId || sanitizedId,
    productName: productData.productName || "Unknown Product",
    stock: stockQty,
    inStock: stockQty > 0,
    cachedAt: productData.updatedAt || null
  };

  return sendJsonResponse(200, responseData);
};
