const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, and PNG allowed."));
    }
  },
});

// Pinata IPFS configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "CivicProof Backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @route   POST /upload
 * @desc    Upload document to IPFS
 * @access  Public
 */
app.post("/upload", upload.single("document"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Document file is required" });
    }

    console.log("📄 Uploading document to IPFS...");
    console.log("   File:", file.originalname);
    console.log("   Size:", (file.size / 1024).toFixed(2), "KB");

    // Upload to Pinata IPFS
    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    // Add metadata
    const metadata = JSON.stringify({
      name: file.originalname,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        service: "CivicProof",
      },
    });
    formData.append("pinataMetadata", metadata);

    // Pinata options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append("pinataOptions", pinataOptions);

    // Make request to Pinata
    const ipfsResponse = await axios.post(PINATA_API_URL, formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    const ipfsHash = ipfsResponse.data.IpfsHash;
    console.log("✅ Uploaded to IPFS:", ipfsHash);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      fileName: file.originalname,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({
      error: "Failed to upload document",
      message: error.message,
    });
  }
});

/**
 * @route   GET /ipfs/:hash
 * @desc    Get IPFS gateway URL
 * @access  Public
 */
app.get("/ipfs/:hash", (req, res) => {
  const { hash } = req.params;
  res.json({
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${hash}`,
    ipfsUrl: `ipfs://${hash}`,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error.message);
  res.status(500).json({
    error: error.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log("==============================================");
  console.log("   CivicProof - Backend Server");
  console.log("==============================================");
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("\n📋 Available endpoints:");
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/upload`);
  console.log(`   GET  http://localhost:${PORT}/ipfs/:hash`);
  console.log("==============================================\n");
});
