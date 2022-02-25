pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Project is ERC721{
    address public owner;
    uint256 public projectGoal;
    uint256 public projectFunds;
    uint256 deadline;
    uint256 badgeID;
    uint256 constant MIN_CONTRIBUTION = 0.01 ether;
    mapping(address => uint) contributions;
    mapping(address => uint) remainders;
    bool public cancelled;

    enum Status {
        ACTIVE,
        FUNDED,
        FAILED
    }

    event NewContribution(address from, uint amount);
    event CreatorWithdrawal(address owner, uint amount);
    event ContributorWithdrawal(address contributor, uint amount);
    event ProjectCancelled(address owner);
    event BadgesIssued(address to, uint badges);
    
    modifier onlyOwner(){
        require(msg.sender == owner, "Must be owner");
        _;
    }

    function status() public view returns (Status) {
        if (projectFunds >= projectGoal) {
            return Status.FUNDED;
        }
        else if (cancelled || block.timestamp >= deadline) {
            return Status.FAILED;
        }
        else {
            return Status.ACTIVE;
        }
    }

    constructor(uint256 _projectGoal, address _owner) ERC721("KickstartBadge", "KICK"){
        projectGoal = _projectGoal;
        owner = _owner;
        deadline = block.timestamp + 30 days;
    }

    function contribute() external payable{
        require(msg.value >= MIN_CONTRIBUTION, "Please deposit the minimum contribution");
        require(status() == Status.ACTIVE, "This project is no longer accepting contributions");

        contributions[msg.sender] += msg.value;
        projectFunds += msg.value;

        uint256 amount = remainders[msg.sender] + msg.value;
        uint256 badgesToMint = amount / 1 ether;
        remainders[msg.sender] = amount % 1 ether;

        if(badgesToMint > 0) issueBadge(badgesToMint);
        
        emit NewContribution(msg.sender, msg.value);
        emit BadgesIssued(msg.sender, badgesToMint);

    }

    function withdraw() external {
        require(status() == Status.FAILED, "This project is still active");
        uint funds = contributions[msg.sender];
        require(funds > 0, "Please contribute funds first");
        projectFunds -= funds;
        contributions[msg.sender] = 0;
        (bool success, ) = msg.sender.call{ value: funds }("");
        require(success, "Transfer failed.");
   
        emit ContributorWithdrawal(msg.sender, funds);

    }

    function cancelProject() onlyOwner external {
        require(!cancelled, "Project is already cancelled");
        cancelled = true; 

        emit ProjectCancelled(owner);
    }

    function creatorWithdraw(uint _amount) external onlyOwner {
        require(status() == Status.FUNDED, "This project is not fully funded");
        require(_amount <= projectFunds, "Insufficent amount");
        (bool success, ) = msg.sender.call{ value: _amount }("");
        require(success, "Transfer failed.");

        emit CreatorWithdrawal(msg.sender, _amount);
    }

    function issueBadge(uint256 amount) internal {
        for(uint i = 0; i < amount; i++){
            badgeID++;
            _mint(msg.sender, badgeID);
        }

    }
}