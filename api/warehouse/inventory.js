/**
 * Vercel Serverless Function: Northstar Retail Warehouse Inventory Source
 * 
 * Route: GET /api/warehouse/inventory
 * 
 * SIMULATED WAREHOUSE SYSTEM:
 * - This endpoint simulates an external enterprise warehouse inventory system.
 * - It acts as the single source of truth for stock levels across all catalog items.
 * - In future architecture steps, a background polling/synchronization job will fetch 
 *   this raw dataset and update the high-speed serverless cache (Upstash Redis).
 * - Intentionally decoupled from Redis and user-facing inventory query logic.
 */

// Mock warehouse inventory dataset (easy to update or extend)
const WAREHOUSE_INVENTORY = [
  {
    productId: "PROD-101",
    productName: "Northstar Wireless Ergonomic Mouse",
    stock: 150
  },
  {
    productId: "PROD-102",
    productName: "Northstar Mechanical RGB Keyboard",
    stock: 42
  },
  {
    productId: "PROD-103",
    productName: "Northstar 27-inch 4K USB-C Monitor",
    stock: 0
  },
  {
    productId: "PROD-104",
    productName: "Northstar Multi-Port Thunderbolt Hub",
    stock: 89
  },
  {
    productId: "PROD-105",
    productName: "Northstar Active Noise-Canceling Headset",
    stock: 5
  }
];

const WAREHOUSE_NAME = "Northstar Central Fulfillment Center";

/**
 * Serverless Request Handler
 * 
 * @param {import('http').IncomingMessage} req - The incoming HTTP request object.
 * @param {import('http').ServerResponse & { json?: Function, status?: Function }} res - The outgoing HTTP response object.
 */
module.exports = function handler(req, res) {
  const sendJsonResponse = (statusCode, payload) => {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(statusCode).json(payload);
    } else {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    }
  };

  try {
    // Only allow GET requests
    if (req.method && req.method.toUpperCase() !== 'GET') {
      return sendJsonResponse(405, {
        error: "Method Not Allowed",
        message: `HTTP method ${req.method} is not allowed on this endpoint. Use GET.`
      });
    }

    const responsePayload = {
      warehouse: WAREHOUSE_NAME,
      timestamp: new Date().toISOString(),
      products: WAREHOUSE_INVENTORY
    };

    return sendJsonResponse(200, responsePayload);
  } catch (error) {
    return sendJsonResponse(500, {
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred while querying warehouse inventory."
    });
  }
};
