/**
 * Vercel Serverless Function: Health Check Endpoint
 * 
 * Route: GET /api/health
 * Returns service status, service name, and current UTC ISO timestamp.
 */
module.exports = function handler(req, res) {
  const payload = {
    status: "ok",
    service: "northstar-serverless-inventory",
    timestamp: new Date().toISOString()
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    // Vercel serverless helper methods
    res.status(200).json(payload);
  } else {
    // Standard Node.js HTTP ServerResponse fallback
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }
};
