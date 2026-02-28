// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CivicProof.sol";

contract DeployCivicProof is Script {
    function run() external {
        // Load deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying CivicProof...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CivicProof — deployer becomes the initial owner
        CivicProof civicProof = new CivicProof(deployer);

        vm.stopBroadcast();

        console.log("CivicProof deployed at:", address(civicProof));
        console.log("Owner:", civicProof.owner());
        console.log("Domain Separator:", vm.toString(civicProof.DOMAIN_SEPARATOR()));
    }
}
