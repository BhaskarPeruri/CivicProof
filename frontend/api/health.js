/**
 * Vercel serverless: GET /api/health
 * Health check for CivicProof backend.
 */
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'OK',
    service: 'CivicProof Backend',
    timestamp: new Date().toISOString(),
  });
};
