// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CivicProof
 * @notice Decentralized public infrastructure transparency & milestone verification contract.
 * @dev Supports incremental fund releases, milestone proofs (IPFS),
 * EIP712 authority signatures, and full QR-based public viewing.
 */
contract CivicProof is EIP712, Ownable {
    using ECDSA for bytes32;

    uint256 public _projectIds;

    constructor(address initialOwner) EIP712("CivicProof", "1") Ownable(initialOwner) {}

    /// @notice Returns the EIP-712 domain separator (for tests and off-chain signing).
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /* -------------------------------------------------------------------------- */
    /*                                   STRUCTS                                  */
    /* -------------------------------------------------------------------------- */

    struct Authority {
        string name;
        string designation;
        address wallet;
    }

    struct Milestone {
        uint256 amountReleased;
        uint256 amountUtilized;
        string proofCID; // IPFS CID
        bool verified;
        uint256 signatureCount;
        mapping(address => bool) hasSigned;
    }

    struct Project {
        string scheme;
        string projectDocumentCID; // Main project document CID
        uint256 sanctionedAmount;
        uint256 totalReleased;
        uint256 totalUtilized;
        uint256 createdAt;
        bool completed;
        Authority[] authorities;
        Milestone[] milestones;
    }

    mapping(uint256 => Project) private projects;
    mapping(uint256 => mapping(address => uint256)) public nonces;

    /* -------------------------------------------------------------------------- */
    /*                                VIEW STRUCTS                                */
    /* -------------------------------------------------------------------------- */

    struct AuthorityView {
        string name;
        string designation;
        address wallet;
    }

    struct MilestoneView {
        uint256 amountReleased;
        uint256 amountUtilized;
        string proofCID;
        bool verified;
        uint256 signatureCount;
    }

    struct ProjectFullView {
        string scheme;
        string projectDocumentCID;
        uint256 sanctionedAmount;
        uint256 totalReleased;
        uint256 totalUtilized;
        bool completed;
        uint256 createdAt;
        AuthorityView[] authorities;
        MilestoneView[] milestones;
    }

    /* -------------------------------------------------------------------------- */
    /*                                EIP712 TYPEHASH                             */
    /* -------------------------------------------------------------------------- */

    bytes32 private constant SIGN_TYPEHASH =
        keccak256(
            "SignMilestone(uint256 projectId,uint256 milestoneId,string proofCID,uint256 nonce)"
        );

    /* -------------------------------------------------------------------------- */
    /*                                   EVENTS                                   */
    /* -------------------------------------------------------------------------- */

    event ProjectCreated(uint256 indexed projectId);
    event FundsReleased(uint256 indexed projectId, uint256 milestoneId);
    event MilestoneVerified(uint256 indexed projectId, uint256 milestoneId);
    event ProjectCompleted(uint256 indexed projectId);

    /* -------------------------------------------------------------------------- */
    /*                                  MODIFIERS                                 */
    /* -------------------------------------------------------------------------- */

    modifier projectExists(uint256 _id) {
        require(_id < _projectIds, "Project does not exist");
        _;
    }

    /* -------------------------------------------------------------------------- */
    /*                             PROJECT CREATION                               */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Creates a new project.
     */
    function createProject(
        string calldata _scheme,
        string calldata _projectDocumentCID,
        uint256 _sanctionedAmount,
        string[] calldata _names,
        string[] calldata _designations,
        address[] calldata _wallets
    ) external onlyOwner {
        require(_sanctionedAmount > 0, "Invalid amount");
        require(
            _names.length == _wallets.length &&
                _names.length == _designations.length,
            "Authority mismatch"
        );
        require(_names.length > 0, "At least one authority");

        uint256 projectId = _projectIds++;
        Project storage p = projects[projectId];

        p.scheme = _scheme;
        p.projectDocumentCID = _projectDocumentCID;
        p.sanctionedAmount = _sanctionedAmount;
        p.createdAt = block.timestamp;

        for (uint256 i = 0; i < _names.length; i++) {
            p.authorities.push(
                Authority({
                    name: _names[i],
                    designation: _designations[i],
                    wallet: _wallets[i]
                })
            );
        }

        emit ProjectCreated(projectId);
    }

    /* -------------------------------------------------------------------------- */
    /*                               FUND RELEASE                                 */
    /* -------------------------------------------------------------------------- */

    function releaseFunds(
        uint256 _id,
        uint256 _amount
    ) external onlyOwner projectExists(_id) {
        Project storage p = projects[_id];

        require(
            p.totalReleased + _amount <= p.sanctionedAmount,
            "Exceeds sanctioned amount"
        );

        p.totalReleased += _amount;

        Milestone storage m = p.milestones.push();
        m.amountReleased = _amount;

        emit FundsReleased(_id, p.milestones.length - 1);
    }

    /* -------------------------------------------------------------------------- */
    /*                           UTILIZATION UPDATE                               */
    /* -------------------------------------------------------------------------- */

    function updateUtilization(
        uint256 _id,
        uint256 _milestoneId,
        uint256 _amount
    ) external onlyOwner projectExists(_id) {
        Project storage p = projects[_id];
        Milestone storage m = p.milestones[_milestoneId];

        require(
            m.amountUtilized + _amount <= m.amountReleased,
            "Exceeds milestone release"
        );

        m.amountUtilized += _amount;
        p.totalUtilized += _amount;
    }

    /* -------------------------------------------------------------------------- */
    /*                          UPLOAD PROOF (IPFS CID)                           */
    /* -------------------------------------------------------------------------- */

    function uploadMilestoneProof(
        uint256 _id,
        uint256 _milestoneId,
        string calldata _proofCID
    ) external onlyOwner projectExists(_id) {
        Milestone storage m = projects[_id].milestones[_milestoneId];

        m.proofCID = _proofCID;
        m.verified = false;
        m.signatureCount = 0;
    }

    /* -------------------------------------------------------------------------- */
    /*                          SIGNATURE SUBMISSION                              */
    /* -------------------------------------------------------------------------- */

    function submitMilestoneSignature(
        uint256 _projectId,
        uint256 _milestoneId,
        string calldata _proofCID,
        uint256 _nonce,
        bytes calldata signature
    ) external projectExists(_projectId) {
        Project storage p = projects[_projectId];
        Milestone storage m = p.milestones[_milestoneId];

        require(
            keccak256(bytes(m.proofCID)) ==
                keccak256(bytes(_proofCID)),
            "Proof mismatch"
        );

        require(!m.hasSigned[msg.sender], "Already signed");
        require(nonces[_projectId][msg.sender] == _nonce, "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                SIGN_TYPEHASH,
                _projectId,
                _milestoneId,
                keccak256(bytes(_proofCID)),
                _nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        require(signer == msg.sender, "Invalid signature");

        bool isAuthority = false;
        for (uint256 i = 0; i < p.authorities.length; i++) {
            if (p.authorities[i].wallet == signer) {
                isAuthority = true;
                break;
            }
        }

        require(isAuthority, "Not authority");

        m.hasSigned[signer] = true;
        m.signatureCount++;
        nonces[_projectId][signer]++;

        if (m.signatureCount == p.authorities.length) {
            m.verified = true;
            emit MilestoneVerified(_projectId, _milestoneId);
            _checkCompletion(_projectId);
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                          PROJECT COMPLETION CHECK                          */
    /* -------------------------------------------------------------------------- */

    function _checkCompletion(uint256 _id) internal {
        Project storage p = projects[_id];

        if (p.totalUtilized < p.sanctionedAmount) return;

        for (uint256 i = 0; i < p.milestones.length; i++) {
            if (!p.milestones[i].verified) return;
        }

        p.completed = true;
        emit ProjectCompleted(_id);
    }

    /* -------------------------------------------------------------------------- */
    /*                            SINGLE FULL VIEW                                */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Returns full project data for QR-based public viewing.
     */
    function getProjectCompleteData(
        uint256 _id
    ) external view projectExists(_id) returns (ProjectFullView memory) {
        Project storage p = projects[_id];

        AuthorityView[] memory authorityViews = new AuthorityView[](
            p.authorities.length
        );

        for (uint256 i = 0; i < p.authorities.length; i++) {
            authorityViews[i] = AuthorityView({
                name: p.authorities[i].name,
                designation: p.authorities[i].designation,
                wallet: p.authorities[i].wallet
            });
        }

        MilestoneView[] memory milestoneViews = new MilestoneView[](
            p.milestones.length
        );

        for (uint256 i = 0; i < p.milestones.length; i++) {
            milestoneViews[i] = MilestoneView({
                amountReleased: p.milestones[i].amountReleased,
                amountUtilized: p.milestones[i].amountUtilized,
                proofCID: p.milestones[i].proofCID,
                verified: p.milestones[i].verified,
                signatureCount: p.milestones[i].signatureCount
            });
        }

        return
            ProjectFullView({
                scheme: p.scheme,
                projectDocumentCID: p.projectDocumentCID,
                sanctionedAmount: p.sanctionedAmount,
                totalReleased: p.totalReleased,
                totalUtilized: p.totalUtilized,
                completed: p.completed,
                createdAt: p.createdAt,
                authorities: authorityViews,
                milestones: milestoneViews
            });
    }

function getProjectCount() external view returns (uint256) {
    return _projectIds;
}
}