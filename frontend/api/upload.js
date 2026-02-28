/**
 * Vercel serverless: POST /api/upload
 * Upload document to IPFS via Pinata.
 * Note: Vercel has a 4.5 MB request body limit on Hobby plan.
 */
const formidable = require('formidable');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 4 * 1024 * 1024, // 4MB (under Vercel limit)
      filter: (part) => {
        if (part.mimetype && !ALLOWED_MIMES.includes(part.mimetype)) {
          reject(new Error('Invalid file type. Only PDF, JPG, and PNG allowed.'));
          return false;
        }
        return true;
      },
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
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
    const file = files.document?.[0] || files.document || files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: 'Document file is required' });
    }

    const filePath = file.filepath;
    const originalName = file.originalFilename || file.newFilename || 'document';
    const mimetype = file.mimetype || 'application/octet-stream';
    const fileStream = fs.createReadStream(filePath);

    const formData = new FormData();
    formData.append('file', fileStream, { filename: originalName, contentType: mimetype });
    formData.append(
      'pinataMetadata',
      JSON.stringify({
        name: originalName,
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
      fileName: originalName,
      fileSize: file.size,
    });
  } catch (error) {
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    const status = error.response?.status;
    const pinataError = error.response?.data?.error || error.response?.data?.message;
    const msg = pinataError || error.message;
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
