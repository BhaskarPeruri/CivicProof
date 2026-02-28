# CivicProof

**Transparent Public Infrastructure Verification on Monad**

CivicProof is a milestone-based infrastructure transparency protocol built on Monad. It enables cryptographic verification of public project progress using EIP-712 authority signatures and IPFS-backed proof storage. Instead of relying on centralized reporting, it provides on-chain fund tracking, signed milestone approvals, and public auditability—including a single QR-accessible view.

---

## Monad Blitz Hyderabad Submission

CivicProof introduces **programmable accountability** for public infrastructure:

- Funds are released **incrementally** (milestone-by-milestone)
- Utilization is **transparently tracked** on-chain
- Milestones are **cryptographically verified** via authority signatures
- Proof is **permanently stored** on IPFS
- Citizens can **publicly audit** project status

---

## The Problem

Public infrastructure often suffers from:

- Lack of transparency in fund allocation
- Delayed or manipulated reporting
- No cryptographic proof of milestone completion
- Centralized authority approvals and no public audit layer

Citizens cannot independently verify: how much was sanctioned, released, or utilized, or whether work was actually completed. **Trust is assumed—not proven.**

---

## The Solution

CivicProof enforces milestone-based transparency through smart contracts.

| Feature              | Description                                   |
| -------------------- | --------------------------------------------- |
| Incremental releases | Milestone-based fund releases                 |
| On-chain tracking    | Sanctioned, released, and utilized amounts    |
| IPFS proofs          | Documents/images stored via Pinata            |
| EIP-712 signatures   | Structured authority signing                  |
| Auto verification    | Milestone verification and project completion |
| QR view              | Citizen-facing transparency page              |

---

## Project Structure (for Hackathon Builders)

The repo has **three main parts**. Run each in its own terminal when developing.

```
CivicProof/
├── contracts/     # Solidity + Foundry — on-chain logic
├── backend/       # Node.js API — IPFS uploads (Pinata)
└── frontend/      # React app — UI + wallet (RainbowKit, wagmi)
```

### `contracts/` — Smart contracts (Foundry)

- **What it is:** CivicProof core contract and deployment scripts.
- **Stack:** Solidity ^0.8.20, OpenZeppelin, EIP-712, **Foundry** (not Hardhat).
- **Key files:**
  - `src/CivicProof.sol` — main contract
  - `script/DeployCivicProof.s.sol` — deploy script
  - `test/CivicProof.t.sol` — tests

### `backend/` — API server (Node.js)

- **What it is:** Small Express server that uploads documents to IPFS via Pinata.
- **Stack:** Express, Multer, Axios, Pinata.
- **Key file:** `server.js`
- **Endpoints:**
  - `GET /health` — health check
  - `POST /upload` — upload file → returns IPFS hash/CID
  - `GET /ipfs/:hash` — get IPFS gateway URL for a hash

### `frontend/` — Web app (React)

- **What it is:** DApp for admins, authorities, and citizens.
- **Stack:** React, Tailwind CSS, **wagmi**, **RainbowKit**, **viem**.
- **Routes:**
  - `/` — Home
  - `/projects` — List projects
  - `/project/:projectId` — Project details + QR view
  - `/admin` — Create projects, add authorities, release milestones
  - `/authority` — Sign milestones (EIP-712)

---

## Architecture (on-chain)

**Project** — scheme name, project document (IPFS CID), sanctioned/released/utilized amounts, authority list, milestones, completion status.

**Milestone** — amount released, amount utilized, proof CID, signature count, verification status, proof version (invalidates old signatures if proof changes).

**Authority** — name, designation, wallet. Authorities sign milestone proofs using EIP-712 typed data.

---

## Security Model

- EIP-712 typed structured signing
- Per-project, per-authority nonces
- Proof version invalidation when proof CID changes
- Signature recovery and authority validation
- Replay attack prevention
- Proof CID bound inside signature

Authorities sign: `SignMilestone(projectId, milestoneId, proofCID, proofVersion, nonce)`. The contract checks: signer is authority, nonce matches, proof CID and version match, signature is valid.

---

## Public Transparency Flow

1. Government (owner) creates a project on-chain.
2. Funds are released per milestone.
3. Contractor uploads proof (PDF/image) → backend returns IPFS CID.
4. Authorities sign the milestone off-chain (EIP-712).
5. Signatures are submitted on-chain.
6. Milestone becomes verified automatically.
7. When all milestones are verified and total utilized ≥ sanctioned → project marked **complete**.

**QR view:** Citizens scan a QR linking to `getProjectCompleteData(projectId)`. Frontend shows metadata, authorities, milestones, amounts, verification status, and proof via `https://ipfs.io/ipfs/<CID>` (no central server required).

---

## Why Monad?

- High throughput, low latency, EVM-compatible.
- Suited for real-time transparency and low-cost public accountability.

---

## Tech Stack Summary

| Layer         | Technologies                                     |
| ------------- | ------------------------------------------------ |
| **Contracts** | Solidity ^0.8.20, OpenZeppelin, EIP-712, Foundry |
| **Backend**   | Node.js, Express, Multer, Pinata (IPFS)          |
| **Frontend**  | React, Tailwind, wagmi, RainbowKit, viem         |
| **Chain**     | Monad (testnet)                                  |

---

## Quick Start (Run Locally)

### 1. Contracts (build, test, deploy)

```bash
cd contracts

# Install dependencies (Foundry: forge already installed)
forge install

# Compile
forge build

# Run tests
forge test

# Deploy to Monad testnet (set PRIVATE_KEY in .env)
# forge script script/DeployCivicProof.s.sol --rpc-url https://testnet-rpc.monad.xyz --private-key $PRIVATE_KEY --broadcast
```

**Contract `.env` (contracts/.env):**

- `PRIVATE_KEY` — deployer wallet private key (with testnet MON).
- `RPC_URL` — e.g. `https://testnet-rpc.monad.xyz`.

### 2. Backend (IPFS uploads)

```bash
cd backend

npm install
cp .env.example .env   # or create .env with:

# Required in .env:
# PORT=5000
# PINATA_JWT=your_pinata_jwt   # from https://app.pinata.cloud/ → API Keys → New Key (JWT)

npm run dev
```

Server runs at `http://localhost:5000`. Upload endpoint expects `document` (file) in `POST /upload`.

### 3. Frontend (React app)

```bash
cd frontend

npm install

# Create .env with:
# REACT_APP_CONTRACT_ADDRESS=0xYourDeployedCivicProofAddress
# REACT_APP_API_URL=http://localhost:5000
# REACT_APP_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id   # from https://cloud.walletconnect.com/

npm start
```

App runs at `http://localhost:3000`. Connect wallet (Monad testnet), then use Admin or Authority flows.

---

## Environment Variables Cheat Sheet

| Where         | Variable                              | Purpose                                  |
| ------------- | ------------------------------------- | ---------------------------------------- |
| **contracts** | `PRIVATE_KEY`                         | Deployer key for `forge script`          |
| **contracts** | `RPC_URL`                             | Monad RPC (e.g. testnet)                 |
| **backend**   | `PORT`                                | Server port (default 5000)               |
| **backend**   | `PINATA_JWT`                          | Pinata JWT for IPFS uploads              |
| **frontend**  | `REACT_APP_CONTRACT_ADDRESS`          | Deployed CivicProof contract             |
| **frontend**  | `REACT_APP_API_URL`                   | Backend URL (e.g. http://localhost:5000) |
| **frontend**  | `REACT_APP_WALLET_CONNECT_PROJECT_ID` | WalletConnect Cloud project ID           |

---

## Deployed Contract (Monad Testnet)

- **Contract address:** `0x4EDdc8877C2e916E767a5Ec29C933Ff1A1591EBC`
- **Explorer:** [Monad Vision – CivicProof](https://testnet.monadvision.com/address/0x4EDdc8877C2e916E767a5Ec29C933Ff1A1591EBC?tab=Contract)

Use this address in `REACT_APP_CONTRACT_ADDRESS` to point the frontend at the live contract.

---

## Example Scenario

- **Project:** Road Expansion Phase 1
- **Sanctioned:** 10,000 MON
- **Milestone 1:** 3,000 MON released, 2,800 MON utilized; proof on IPFS; authorities sign → milestone verified.  
  All of this is on-chain and auditable.

---

## Future Ideas

- Aadhaar-based authority verification (India)
- AI agents for image/progress verification
- Predictive risk analysis
- DAO-based oversight
- zk-proofs for compliance
- ERC-721 project identity (NFT)
- On-chain progress scoring

---

## Vision

CivicProof is a **programmable accountability layer** for government infrastructure, DAO treasuries, NGO grants, and public-sector digital governance. Trust should be **cryptographic—not assumed**.

**Built for:** Monad Blitz Hyderabad

**License:** MIT
