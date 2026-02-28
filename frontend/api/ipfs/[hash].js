/**
 * Vercel serverless: GET /api/ipfs/:hash
 * Returns IPFS gateway URL for a given hash.
 */
module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const hash = req.query.hash;
  if (!hash) {
    return res.status(400).json({ error: 'Hash is required' });
  }
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${hash}`,
    ipfsUrl: `ipfs://${hash}`,
  });
};
