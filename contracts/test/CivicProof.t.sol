// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CivicProof.sol";

contract CivicProofTest is Test {
    CivicProof public civicProof;

    address public owner;
    address public authority1;
    address public authority2;
    address public nonAuthority;

    uint256 public authority1Key;
    uint256 public authority2Key;

    // EIP712 domain separator components
    bytes32 private constant SIGN_TYPEHASH =
        keccak256(
            "SignMilestone(uint256 projectId,uint256 milestoneId,string proofCID,uint256 nonce)"
        );

    function setUp() public {
        owner = makeAddr("owner");

        (authority1, authority1Key) = makeAddrAndKey("authority1");
        (authority2, authority2Key) = makeAddrAndKey("authority2");
        nonAuthority = makeAddr("nonAuthority");

        vm.prank(owner);
        civicProof = new CivicProof(owner);
    }

    /* -------------------------------------------------------------------------- */
    /*                           HELPER FUNCTIONS                                 */
    /* -------------------------------------------------------------------------- */

    function _createDefaultProject() internal returns (uint256 projectId) {
        string[] memory names = new string[](2);
        names[0] = "Alice";
        names[1] = "Bob";

        string[] memory designations = new string[](2);
        designations[0] = "Engineer";
        designations[1] = "Inspector";

        address[] memory wallets = new address[](2);
        wallets[0] = authority1;
        wallets[1] = authority2;

        vm.prank(owner);
        civicProof.createProject(
            "Road Construction",
            "QmProjectDocCID",
            1000 ether,
            names,
            designations,
            wallets
        );

        return 0; // first project
    }

    function _createSingleAuthorityProject() internal returns (uint256) {
        string[] memory names = new string[](1);
        names[0] = "Alice";

        string[] memory designations = new string[](1);
        designations[0] = "Engineer";

        address[] memory wallets = new address[](1);
        wallets[0] = authority1;

        vm.prank(owner);
        civicProof.createProject(
            "Bridge",
            "QmSingleDocCID",
            500 ether,
            names,
            designations,
            wallets
        );

        return 0;
    }

    function _signMilestone(
        uint256 privateKey,
        uint256 projectId,
        uint256 milestoneId,
        string memory proofCID,
        uint256 nonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                SIGN_TYPEHASH,
                projectId,
                milestoneId,
                keccak256(bytes(proofCID)),
                nonce
            )
        );

        bytes32 domainSeparator = civicProof.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    /* -------------------------------------------------------------------------- */
    /*                          PROJECT CREATION TESTS                            */
    /* -------------------------------------------------------------------------- */

    function test_CreateProject_Success() public {
        uint256 projectId = _createDefaultProject();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);

        assertEq(view_.scheme, "Road Construction");
        assertEq(view_.projectDocumentCID, "QmProjectDocCID");
        assertEq(view_.sanctionedAmount, 1000 ether);
        assertEq(view_.totalReleased, 0);
        assertEq(view_.totalUtilized, 0);
        assertFalse(view_.completed);
        assertEq(view_.authorities.length, 2);
        assertEq(view_.authorities[0].name, "Alice");
        assertEq(view_.authorities[1].name, "Bob");
        assertEq(view_.authorities[0].wallet, authority1);
        assertEq(view_.authorities[1].wallet, authority2);
    }

    function test_CreateProject_EmitsEvent() public {
        string[] memory names = new string[](1);
        names[0] = "Alice";
        string[] memory designations = new string[](1);
        designations[0] = "Engineer";
        address[] memory wallets = new address[](1);
        wallets[0] = authority1;

        vm.expectEmit(true, false, false, false);
        emit CivicProof.ProjectCreated(0);

        vm.prank(owner);
        civicProof.createProject("Scheme", "CID", 100 ether, names, designations, wallets);
    }

    function test_CreateProject_RevertIf_NotOwner() public {
        string[] memory names = new string[](1);
        names[0] = "Alice";
        string[] memory designations = new string[](1);
        designations[0] = "Eng";
        address[] memory wallets = new address[](1);
        wallets[0] = authority1;

        vm.prank(nonAuthority);
        vm.expectRevert();
        civicProof.createProject("Scheme", "CID", 100 ether, names, designations, wallets);
    }

    function test_CreateProject_RevertIf_ZeroAmount() public {
        string[] memory names = new string[](1);
        names[0] = "Alice";
        string[] memory designations = new string[](1);
        designations[0] = "Eng";
        address[] memory wallets = new address[](1);
        wallets[0] = authority1;

        vm.prank(owner);
        vm.expectRevert("Invalid amount");
        civicProof.createProject("Scheme", "CID", 0, names, designations, wallets);
    }

    function test_CreateProject_RevertIf_AuthorityMismatch() public {
        string[] memory names = new string[](2);
        names[0] = "Alice";
        names[1] = "Bob";
        string[] memory designations = new string[](1);
        designations[0] = "Eng";
        address[] memory wallets = new address[](2);
        wallets[0] = authority1;
        wallets[1] = authority2;

        vm.prank(owner);
        vm.expectRevert("Authority mismatch");
        civicProof.createProject("Scheme", "CID", 100 ether, names, designations, wallets);
    }

    function test_CreateProject_RevertIf_EmptyAuthorities() public {
        string[] memory names = new string[](0);
        string[] memory designations = new string[](0);
        address[] memory wallets = new address[](0);

        vm.prank(owner);
        vm.expectRevert("At least one authority");
        civicProof.createProject("Scheme", "CID", 100 ether, names, designations, wallets);
    }

    function test_CreateMultipleProjects_IncrementIds() public {
        _createDefaultProject();

        string[] memory names = new string[](1);
        names[0] = "Carol";
        string[] memory designations = new string[](1);
        designations[0] = "Manager";
        address[] memory wallets = new address[](1);
        wallets[0] = authority1;

        vm.prank(owner);
        civicProof.createProject("Water Supply", "QmDoc2", 500 ether, names, designations, wallets);

        CivicProof.ProjectFullView memory project2 = civicProof.getProjectCompleteData(1);
        assertEq(project2.scheme, "Water Supply");
    }

    /* -------------------------------------------------------------------------- */
    /*                            FUND RELEASE TESTS                              */
    /* -------------------------------------------------------------------------- */

    function test_ReleaseFunds_Success() public {
        uint256 projectId = _createDefaultProject();

        vm.expectEmit(true, true, false, false);
        emit CivicProof.FundsReleased(projectId, 0);

        vm.prank(owner);
        civicProof.releaseFunds(projectId, 400 ether);

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.totalReleased, 400 ether);
        assertEq(view_.milestones.length, 1);
        assertEq(view_.milestones[0].amountReleased, 400 ether);
    }

    function test_ReleaseFunds_MultipleMilestones() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 400 ether);
        civicProof.releaseFunds(projectId, 300 ether);
        vm.stopPrank();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.totalReleased, 700 ether);
        assertEq(view_.milestones.length, 2);
        assertEq(view_.milestones[1].amountReleased, 300 ether);
    }

    function test_ReleaseFunds_RevertIf_ExceedsSanctioned() public {
        uint256 projectId = _createDefaultProject();

        vm.prank(owner);
        vm.expectRevert("Exceeds sanctioned amount");
        civicProof.releaseFunds(projectId, 1001 ether);
    }

    function test_ReleaseFunds_RevertIf_NotOwner() public {
        uint256 projectId = _createDefaultProject();

        vm.prank(nonAuthority);
        vm.expectRevert();
        civicProof.releaseFunds(projectId, 100 ether);
    }

    function test_ReleaseFunds_RevertIf_InvalidProject() public {
        vm.prank(owner);
        vm.expectRevert("Project does not exist");
        civicProof.releaseFunds(999, 100 ether);
    }

    /* -------------------------------------------------------------------------- */
    /*                         UTILIZATION UPDATE TESTS                           */
    /* -------------------------------------------------------------------------- */

    function test_UpdateUtilization_Success() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 400 ether);
        civicProof.updateUtilization(projectId, 0, 300 ether);
        vm.stopPrank();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.totalUtilized, 300 ether);
        assertEq(view_.milestones[0].amountUtilized, 300 ether);
    }

    function test_UpdateUtilization_RevertIf_ExceedsMilestoneRelease() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 400 ether);
        vm.expectRevert("Exceeds milestone release");
        civicProof.updateUtilization(projectId, 0, 401 ether);
        vm.stopPrank();
    }

    function test_UpdateUtilization_Incremental() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 400 ether);
        civicProof.updateUtilization(projectId, 0, 200 ether);
        civicProof.updateUtilization(projectId, 0, 200 ether);
        vm.stopPrank();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.milestones[0].amountUtilized, 400 ether);
    }

    function test_UpdateUtilization_RevertIf_NotOwner() public {
        uint256 projectId = _createDefaultProject();

        vm.prank(owner);
        civicProof.releaseFunds(projectId, 400 ether);

        vm.prank(nonAuthority);
        vm.expectRevert();
        civicProof.updateUtilization(projectId, 0, 100 ether);
    }

    /* -------------------------------------------------------------------------- */
    /*                          UPLOAD PROOF TESTS                                */
    /* -------------------------------------------------------------------------- */

    function test_UploadMilestoneProof_Success() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 400 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID123");
        vm.stopPrank();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.milestones[0].proofCID, "QmProofCID123");
        assertFalse(view_.milestones[0].verified);
        assertEq(view_.milestones[0].signatureCount, 0);
    }

    function test_UploadMilestoneProof_ResetsVerification() public {
        uint256 projectId = _createSingleAuthorityProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        // Sign to verify
        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 0);
        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig);

        // Upload new proof - should reset
        vm.prank(owner);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCIDNew");

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.milestones[0].proofCID, "QmProofCIDNew");
        assertFalse(view_.milestones[0].verified);
        assertEq(view_.milestones[0].signatureCount, 0);
    }

    function test_UploadMilestoneProof_RevertIf_NotOwner() public {
        uint256 projectId = _createDefaultProject();

        vm.prank(owner);
        civicProof.releaseFunds(projectId, 400 ether);

        vm.prank(nonAuthority);
        vm.expectRevert();
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID");
    }

    /* -------------------------------------------------------------------------- */
    /*                        SIGNATURE SUBMISSION TESTS                          */
    /* -------------------------------------------------------------------------- */

    function test_SubmitSignature_Success_SingleAuthority() public {
        uint256 projectId = _createSingleAuthorityProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 0);

        vm.expectEmit(true, true, false, false);
        emit CivicProof.MilestoneVerified(projectId, 0);

        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig);

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertTrue(view_.milestones[0].verified);
        assertEq(view_.milestones[0].signatureCount, 1);
    }

    function test_SubmitSignature_Success_MultipleAuthorities() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        // Authority1 signs
        bytes memory sig1 = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 0);
        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig1);

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertFalse(view_.milestones[0].verified); // Not verified yet
        assertEq(view_.milestones[0].signatureCount, 1);

        // Authority2 signs
        bytes memory sig2 = _signMilestone(authority2Key, projectId, 0, "QmProofCID1", 0);

        vm.expectEmit(true, true, false, false);
        emit CivicProof.MilestoneVerified(projectId, 0);

        vm.prank(authority2);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig2);

        view_ = civicProof.getProjectCompleteData(projectId);
        assertTrue(view_.milestones[0].verified);
        assertEq(view_.milestones[0].signatureCount, 2);
    }

    function test_SubmitSignature_NoncesIncrement() public {
        uint256 projectId = _createSingleAuthorityProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 250 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        civicProof.releaseFunds(projectId, 250 ether);
        civicProof.uploadMilestoneProof(projectId, 1, "QmProofCID2");
        vm.stopPrank();

        // Sign milestone 0 (nonce = 0)
        bytes memory sig1 = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 0);
        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig1);

        assertEq(civicProof.nonces(projectId, authority1), 1);

        // Sign milestone 1 (nonce = 1)
        bytes memory sig2 = _signMilestone(authority1Key, projectId, 1, "QmProofCID2", 1);
        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 1, "QmProofCID2", 1, sig2);

        assertEq(civicProof.nonces(projectId, authority1), 2);
    }

    function test_SubmitSignature_RevertIf_AlreadySigned() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 0);
        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig);

        // Try signing again (nonce incremented so need new sig, but hasSigned is true)
        bytes memory sig2 = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 1);
        vm.prank(authority1);
        vm.expectRevert("Already signed");
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 1, sig2);
    }

    function test_SubmitSignature_RevertIf_InvalidNonce() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        // Use wrong nonce (1 instead of 0)
        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 1);
        vm.prank(authority1);
        vm.expectRevert("Invalid nonce");
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 1, sig);
    }

    function test_SubmitSignature_RevertIf_ProofMismatch() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmWrongCID", 0);
        vm.prank(authority1);
        vm.expectRevert("Proof mismatch");
        civicProof.submitMilestoneSignature(projectId, 0, "QmWrongCID", 0, sig);
    }

    function test_SubmitSignature_RevertIf_NotAuthority() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        uint256 nonAuthorityKey = 0xBEEF;
        address nonAuth = vm.addr(nonAuthorityKey);

        bytes memory sig = _signMilestone(nonAuthorityKey, projectId, 0, "QmProofCID1", 0);
        vm.prank(nonAuth);
        vm.expectRevert("Not authority");
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig);
    }

    function test_SubmitSignature_RevertIf_InvalidSignature() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProofCID1");
        vm.stopPrank();

        // authority1 signs but authority2 submits
        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmProofCID1", 0);
        vm.prank(authority2);
        vm.expectRevert("Invalid signature");
        civicProof.submitMilestoneSignature(projectId, 0, "QmProofCID1", 0, sig);
    }

    /* -------------------------------------------------------------------------- */
    /*                        PROJECT COMPLETION TESTS                            */
    /* -------------------------------------------------------------------------- */

    function test_ProjectCompletion_FullFlow() public {
        uint256 projectId = _createSingleAuthorityProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 500 ether);
        civicProof.updateUtilization(projectId, 0, 500 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmFinalProof");
        vm.stopPrank();

        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmFinalProof", 0);

        vm.expectEmit(true, true, false, false);
        emit CivicProof.MilestoneVerified(projectId, 0);

        vm.expectEmit(true, false, false, false);
        emit CivicProof.ProjectCompleted(projectId);

        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmFinalProof", 0, sig);

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertTrue(view_.completed);
    }

    function test_ProjectNotCompleted_IfNotAllMilestonesVerified() public {
        uint256 projectId = _createSingleAuthorityProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 250 ether);
        civicProof.updateUtilization(projectId, 0, 250 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProof1");
        civicProof.releaseFunds(projectId, 250 ether);
        civicProof.updateUtilization(projectId, 1, 250 ether);
        // Do NOT upload proof for milestone 1
        vm.stopPrank();

        // Sign milestone 0
        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmProof1", 0);
        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProof1", 0, sig);

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertFalse(view_.completed);
    }

    function test_ProjectNotCompleted_IfTotalUtilizedInsufficient() public {
        uint256 projectId = _createSingleAuthorityProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 400 ether); // less than sanctioned 500
        civicProof.updateUtilization(projectId, 0, 400 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProof1");
        vm.stopPrank();

        bytes memory sig = _signMilestone(authority1Key, projectId, 0, "QmProof1", 0);
        vm.prank(authority1);
        civicProof.submitMilestoneSignature(projectId, 0, "QmProof1", 0, sig);

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertFalse(view_.completed); // Utilized 400 < sanctioned 500
    }

    /* -------------------------------------------------------------------------- */
    /*                             VIEW FUNCTION TESTS                            */
    /* -------------------------------------------------------------------------- */

    function test_GetProjectCompleteData_RevertIf_InvalidId() public {
        vm.expectRevert("Project does not exist");
        civicProof.getProjectCompleteData(0);
    }

    function test_GetProjectCompleteData_EmptyMilestones() public {
        uint256 projectId = _createDefaultProject();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.milestones.length, 0);
    }

    function test_GetProjectCompleteData_FullData() public {
        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, 400 ether);
        civicProof.updateUtilization(projectId, 0, 300 ether);
        civicProof.uploadMilestoneProof(projectId, 0, "QmProof");
        vm.stopPrank();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);

        assertEq(view_.scheme, "Road Construction");
        assertEq(view_.projectDocumentCID, "QmProjectDocCID");
        assertEq(view_.sanctionedAmount, 1000 ether);
        assertEq(view_.totalReleased, 400 ether);
        assertEq(view_.totalUtilized, 300 ether);
        assertFalse(view_.completed);
        assertEq(view_.milestones.length, 1);
        assertEq(view_.milestones[0].amountReleased, 400 ether);
        assertEq(view_.milestones[0].amountUtilized, 300 ether);
        assertEq(view_.milestones[0].proofCID, "QmProof");
        assertFalse(view_.milestones[0].verified);
        assertEq(view_.milestones[0].signatureCount, 0);
    }

    /* -------------------------------------------------------------------------- */
    /*                           FUZZ TESTS                                        */
    /* -------------------------------------------------------------------------- */

    function testFuzz_ReleaseFunds_WithinBounds(uint96 amount) public {
        vm.assume(amount > 0 && amount <= 1000 ether);

        uint256 projectId = _createDefaultProject();

        vm.prank(owner);
        civicProof.releaseFunds(projectId, amount);

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.totalReleased, amount);
    }

    function testFuzz_UpdateUtilization_WithinRelease(uint96 release, uint96 utilized) public {
        vm.assume(release > 0 && release <= 1000 ether);
        vm.assume(utilized > 0 && utilized <= release);

        uint256 projectId = _createDefaultProject();

        vm.startPrank(owner);
        civicProof.releaseFunds(projectId, release);
        civicProof.updateUtilization(projectId, 0, utilized);
        vm.stopPrank();

        CivicProof.ProjectFullView memory view_ = civicProof.getProjectCompleteData(projectId);
        assertEq(view_.milestones[0].amountUtilized, utilized);
    }
}
