pragma solidity ^0.8.3;

import "./Project.sol";

contract ProjectFactory {
    Project[] public createdProjects;

    function createProject(uint256 _projectGoal, address _owner) external {
        Project project = new Project(_projectGoal, _owner);
        createdProjects.push(project);

    }

    function getProjects() public view returns(Project[] memory){
        return createdProjects;
    }
}
