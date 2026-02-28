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

//forge script script/DeployCivicProof.s.sol --rpc-url https://testnet-rpc.monad.xyz  --private-key $PRIVATE_KEY  --broadcast 
//forge verify-contract  0xc38a50B7Bd3254059237e972483ef92b3DD634FC       src/CivicProof.sol:CivicProof    --chain 10143   --verifier sourcify     --verifier-url https://sourcify-api-monad.blockvision.org/     --constructor-args $(cast abi-encode "constructor(address)" 0x2e118e720e4142E75fC79a0f57745Af650d39F94)