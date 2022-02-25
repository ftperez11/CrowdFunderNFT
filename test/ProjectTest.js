const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Project Contract", function(){
    let owner;
    let addr1;
    let addr2;
    let project;
    let goal = ethers.utils.parseEther("6");

    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const ProjectContract = await ethers.getContractFactory("Project");
        project = await ProjectContract.deploy(goal, owner.address);
        await project.deployed();
    })
    
    describe('Test getter functions', () => {
        it("Should confirm the owner", async () => {
            let currentOwner = await project.owner()
            expect(currentOwner).to.equal(owner.address);
        });
        it("Should confirm the goal", async () => {
            let currentGoal = await project.projectGoal()
            expect(currentGoal).to.equal(goal);
        });
    })
    describe('Test contributions', () => {
        it("Should not accept less than minimum contribution", async () => {
            let amount = ethers.utils.parseEther('0.001');

            await expect(
              project.contribute({ value: amount })
            ).to.be.revertedWith('Please deposit the minimum contribution');
        });

        it("Should not accept additional contributions once goal is met", async () => {
            let amount = ethers.utils.parseEther('15');
            let tx = await project.contribute({ value: amount })
            tx.wait();

            await expect(
              project.contribute({ value: goal })
            ).to.be.revertedWith("This project is no longer accepting contributions");
        });
        
        it("Should not accept contributions when project cancelled", async function(){
            let amount = ethers.utils.parseEther('2');
            let tx = await project.cancelProject();
            tx.wait();

            await expect(
              project.contribute({ value: amount })
            ).to.be.revertedWith("This project is no longer accepting contributions");

        })
        it("Should not issue Badges if amount is less than 1 Ether", async function(){
            let amount = ethers.utils.parseEther('0.5');
            let tx = await project.connect(addr1).contribute({ value: amount })

            await expect(tx)
            .to.emit(project, 'NewContribution')
            .withArgs(addr1.address, amount);

            await expect(tx)
            .to.emit(project, 'BadgesIssued')
            .withArgs(addr1.address, 0);
        })

        it("Should accept contributions and issue Badge(s)", async function(){
            let amount = ethers.utils.parseEther('2');
            let tx = await project.connect(addr1).contribute({ value: amount })

            await expect(tx)
            .to.emit(project, 'NewContribution')
            .withArgs(addr1.address, amount);

            await expect(tx)
            .to.emit(project, 'BadgesIssued')
            .withArgs(addr1.address, 2);
        })


        it('multiple contributions properly handled', async () => {
            const amount = ethers.utils.parseEther('4.5');
            const secondAmount = ethers.utils.parseEther('0.5');
            const thirdAmount = ethers.utils.parseEther('5.8');
      
            const tx1 = project.connect(addr1).contribute({ value: amount });
      
            await expect(tx1)
              .to.emit(project, 'NewContribution')
              .withArgs(addr1.address, amount);
      
            await expect(tx1)
              .to.emit(project, 'BadgesIssued')
              .withArgs(addr1.address, 4);
      
            const tx2 = project.connect(addr1).contribute({ value: secondAmount });
      
            await expect(tx2)
              .to.emit(project, 'NewContribution')
              .withArgs(addr1.address, secondAmount);
      
            await expect(tx2)
              .to.emit(project, 'BadgesIssued')
              .withArgs(addr1.address, 1);
      
            const tx3 = project.connect(addr1).contribute({ value: thirdAmount })
      
              await expect(tx3)
                .to.emit(project, 'NewContribution')
                .withArgs(addr1.address, thirdAmount);
        
              await expect(tx3)
                .to.emit(project, 'BadgesIssued')
                .withArgs(addr1.address, 5);
        });



        it("Should not allow contributions after 30 days", async function(){
            const days = 35;
            await ethers.provider.send('evm_increaseTime', [days * 24 * 60 * 60]); 
            await ethers.provider.send('evm_mine');

            let amount = ethers.utils.parseEther('2');

            await expect(
                project.contribute({ value: amount })
              ).to.be.revertedWith("This project is no longer accepting contributions");
        })

    })

    describe('Test creatorWithdraw function', () => {
        it("Should allow creator to withdraw funds when project is funded", async () => {
            let depositAmount = ethers.utils.parseEther('6');
            let withdrawAmount = ethers.utils.parseEther('3');
            let tx = await project.connect(addr1).contribute({ value: depositAmount })
            tx.wait()

            let tx_2 = await project.creatorWithdraw(withdrawAmount)
            tx_2.wait()

            await expect(tx_2)
            .to.emit(project, 'CreatorWithdrawal')
            .withArgs(owner.address, withdrawAmount);
        });
    })

    describe('Test canceling project', () => {
        it("Should revert if someone other than owner tries to cancel project", async () => {

            await expect(project.connect(addr2).cancelProject()).to.be.revertedWith("Must be owner");
        });
        it("Should allow creator to cancel the project and mark project as cancelled", async () => {

            let tx = await project.cancelProject()
            tx.wait()

            let cancelled = await project.cancelled()
            expect(cancelled).to.equal(true);

            await expect(tx)
            .to.emit(project, 'ProjectCancelled')
            .withArgs(owner.address);
        });
    })

    describe('Test withdraw function', () => {
        it("Should revert if the project is still active", async () => {
            let depositAmount = ethers.utils.parseEther('2');
            let tx = await project.connect(addr1).contribute({ value: depositAmount })
            tx.wait()
            await expect(project.connect(addr1).withdraw()).to.be.revertedWith("This project is still active");
        });
        it("Should allow contributors to withdraw funds once project fails", async () => {
            let depositAmount = ethers.utils.parseEther('2');
            let tx = await project.connect(addr1).contribute({ value: depositAmount })
            tx.wait()

            const days = 35;
            await ethers.provider.send('evm_increaseTime', [days * 24 * 60 * 60]); 
            await ethers.provider.send('evm_mine');
            
            await expect(project.connect(addr1).withdraw())
                .to.emit(project, 'ContributorWithdrawal')
                .withArgs(addr1.address, depositAmount);

        });
    })

    
    
    
})