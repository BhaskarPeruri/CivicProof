/**
 * Vercel serverless: POST /api/upload
 * Upload document to IPFS via Pinata.
 * Uses formidable-serverless on Vercel to avoid "formidable is not a function" and request handling issues.
 * Note: Vercel has a 4.5 MB request body limit on Hobby plan.
 */
const formidable = require('formidable-serverless');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = process.env.VERCEL === '1' ? '/tmp' : undefined;
    form.maxFileSize = 4 * 1024 * 1024; // 4MB (under Vercel limit)
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

// Normalize file from either formidable v1 (path, name, type) or v3 (filepath, originalFilename, mimetype)
function getFileInfo(file) {
  if (!file) return null;
  const path = file.filepath || file.path;
  const name = file.originalFilename || file.newFilename || file.name || 'document';
  const mimetype = file.mimetype || file.type || 'application/octet-stream';
  const size = file.size;
  return path ? { path, name, mimetype, size } : null;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PINATA_JWT = process.env.PINATA_JWT;
  if (!PINATA_JWT) {
    return res.status(500).json({
      error: 'Pinata JWT not configured',
      message: 'Set PINATA_JWT in Vercel Environment Variables. Get JWT from https://app.pinata.cloud/',
    });
  }

  try {
    const { files } = await parseMultipart(req);
    const rawFile = files.document || files.file;
    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;
    const info = getFileInfo(file);
    if (!info) {
      return res.status(400).json({ error: 'Document file is required' });
    }
    if (info.mimetype && !ALLOWED_MIMES.includes(info.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Only PDF, JPG, and PNG allowed.',
      });
    }

    const fileStream = fs.createReadStream(info.path);
    const formData = new FormData();
    formData.append('file', fileStream, { filename: info.name, contentType: info.mimetype });
    formData.append(
      'pinataMetadata',
      JSON.stringify({
        name: info.name,
        keyvalues: { uploadedAt: new Date().toISOString(), service: 'CivicProof' },
      })
    );
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const ipfsResponse = await axios.post(PINATA_API_URL, formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    const ipfsHash = ipfsResponse.data.IpfsHash;
    return res.status(200).json({
      success: true,
      ipfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      fileName: info.name,
      fileSize: info.size,
    });
  } catch (error) {
    console.error('[api/upload]', error.message || error);
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    const status = error.response?.status;
    const pinataError = error.response?.data?.error || error.response?.data?.message;
    const msg = pinataError || error.message || String(error);
    if (status === 403) {
      return res.status(403).json({
        error: 'Pinata rejected upload (403)',
        message: msg || 'JWT may be expired or revoked. Generate a new JWT at https://app.pinata.cloud/',
      });
    }
    return res.status(500).json({
      error: 'Failed to upload document',
      message: msg,
    });
  }
};
