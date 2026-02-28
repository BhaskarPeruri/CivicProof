import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

// Monad Testnet Configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet-explorer.monad.xyz',
    },
  },
  testnet: true,
};

// Configure chains with Monad Testnet
const { chains, publicClient } = configureChains(
  [monadTestnet],
  [publicProvider()]
);

// Get wallet connectors
const { connectors } = getDefaultWallets({
  appName: 'CivicProof',
  projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 'civicproof',
  chains,
});

// Create wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains };

// Contract ABI (CivicProof)
export const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "initialOwner", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_scheme", "type": "string" },
      { "internalType": "string", "name": "_projectDocumentCID", "type": "string" },
      { "internalType": "uint256", "name": "_sanctionedAmount", "type": "uint256" },
      { "internalType": "string[]", "name": "_names", "type": "string[]" },
      { "internalType": "string[]", "name": "_designations", "type": "string[]" },
      { "internalType": "address[]", "name": "_wallets", "type": "address[]" }
    ],
    "name": "createProject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_id", "type": "uint256" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "releaseFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_id", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "updateUtilization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_id", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "string", "name": "_proofCID", "type": "string" }
    ],
    "name": "uploadMilestoneProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_projectId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "string", "name": "_proofCID", "type": "string" },
      { "internalType": "uint256", "name": "_nonce", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "submitMilestoneSignature",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "getProjectCompleteData",
    "outputs": [{
      "components": [
        { "internalType": "string", "name": "scheme", "type": "string" },
        { "internalType": "string", "name": "projectDocumentCID", "type": "string" },
        { "internalType": "uint256", "name": "sanctionedAmount", "type": "uint256" },
        { "internalType": "uint256", "name": "totalReleased", "type": "uint256" },
        { "internalType": "uint256", "name": "totalUtilized", "type": "uint256" },
        { "internalType": "bool", "name": "completed", "type": "bool" },
        { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
        {
          "components": [
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "designation", "type": "string" },
            { "internalType": "address", "name": "wallet", "type": "address" }
          ],
          "internalType": "struct CivicProof.AuthorityView[]", "name": "authorities", "type": "tuple[]"
        },
        {
          "components": [
            { "internalType": "uint256", "name": "amountReleased", "type": "uint256" },
            { "internalType": "uint256", "name": "amountUtilized", "type": "uint256" },
            { "internalType": "string", "name": "proofCID", "type": "string" },
            { "internalType": "bool", "name": "verified", "type": "bool" },
            { "internalType": "uint256", "name": "signatureCount", "type": "uint256" }
          ],
          "internalType": "struct CivicProof.MilestoneView[]", "name": "milestones", "type": "tuple[]"
        }
      ],
      "internalType": "struct CivicProof.ProjectFullView", "name": "", "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "getProjectScheme",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProjectCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "isProjectCompleted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "nonces",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DOMAIN_SEPARATOR",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }
    ],
    "name": "ProjectCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" }
    ],
    "name": "FundsReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" }
    ],
    "name": "MilestoneVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }
    ],
    "name": "ProjectCompleted",
    "type": "event"
  }
];

// Contract address (update after deployment)
export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Backend API URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// EIP712 Domain for signing
export const EIP712_DOMAIN = {
  name: 'CivicProof',
  version: '1',
  chainId: 10143,
  verifyingContract: CONTRACT_ADDRESS,
};

// EIP712 Types for milestone signing
export const EIP712_TYPES = {
  SignMilestone: [
    { name: 'projectId', type: 'uint256' },
    { name: 'milestoneId', type: 'uint256' },
    { name: 'proofCID', type: 'string' },
    { name: 'nonce', type: 'uint256' },
  ],
};
