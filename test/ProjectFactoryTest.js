const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Factory Contract", function(){
    let owner;
    let addr1;
    let addr2;
    let factory;

    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const ProjectFactory = await ethers.getContractFactory("ProjectFactory");
        factory = await ProjectFactory.deploy();
        await factory.deployed();
        
    })

    it("Should have zero projects to start", async function(){
        let projects = await factory.getProjects();
        expect(projects).to.deep.equal([]);
    })

    it("Should create 1 new project", async function(){
        let goal = ethers.utils.parseEther("5")
        let tx = await factory.connect(addr1).createProject(goal, addr1.address);
        tx.wait()
        let projects = await factory.getProjects()
        expect(projects.length).to.equal(1);
    })
    
    
})