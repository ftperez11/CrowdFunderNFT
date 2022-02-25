## Project Spec
 Build a crowdfunding campaign project that allows creators to register and crowdsource ETH via project smart contracts. Utilize the Factory contract pattern to easily manage, and quickly deploy multiple contract instances. Project owners can specify a campaign funding goal, and maintain the ability to cancel projects at any time. Once the funding goal has been met, the project creators can withdraw the raised funds. When someone contributes 1 ETH, they receive a contributor badge NFT, which is tradable.
 
### How to install and run
 - Clone the repo to your local machine. There are no environment variables to setup unless you wish to deploy to a network.
 - Run "npm install" to install all dependencies
 - There currently is no front end for the project
 - Test cases can be found under the test folder and can be ran with the command "npx hardhat test"
 
### Design Exercise
*Smart contracts have a hard limit of 24kb. Crowdfundr hands out an NFT to everyone who contributes. However, consider how Kickstarter has multiple contribution tiers. How would you design your contract to support this, without creating three separate NFT contracts?*

**Answer:**
* Leverage the ERC1155 token standard instead of the ERC-721 standard. This would be more useful to manage tiered NFT donations.
* The ERC-1155 allows for:
    * Multiple "types" of NFT metadata within the same contract
    * Allows for batch minting
    * Has improved gas efficiency

### Known Relevant Hacks

 - Re-entrancy