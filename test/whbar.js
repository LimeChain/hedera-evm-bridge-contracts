const etherlime = require("etherlime-lib");
const WHBAR = require("../build/WHBAR");
const ethers = require("ethers");

describe("WHBAR", function () {
    let alice = accounts[1].signer;
    let owner = accounts[9];
    let controller = accounts[8].signer;
    let whbarInstace;

    const name = "WrapedHBAR";
    const symbol = "WHBAR";
    const decimals = 8;


    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
        whbarInstace = await deployer.deploy(
            WHBAR,
            {},
            name,
            symbol,
            decimals
        );
    });

    it("should deploy token contract", async () => {
        assert.isAddress(
            whbarInstace.contractAddress,
            "The contract was not deployed"
        );
        const _owner = await whbarInstace.owner();
        assert.equal(_owner, owner.signer.address);

        const _decimals = await whbarInstace.decimals();

        assert.equal(_decimals, decimals);
    });

    it("should pause the token", async () => {
        await whbarInstace.from(owner).pause();
        const isPaused = await whbarInstace.paused();
        assert.ok(isPaused);
    });

    it("should revert if not owner tries to pause the token", async () => {
        const expectedRevertMessage = "Ownable: caller is not the owner";
        await assert.revertWith(whbarInstace.from(alice).pause(), expectedRevertMessage);
    });

    it("should unpause the token", async () => {
        await whbarInstace.from(owner).pause();

        await whbarInstace.from(owner).unpause();
        const isPaused = await whbarInstace.paused();
        assert.ok(!isPaused);
    });

    it("should revert if not owner tries to unpause the token", async () => {
        await whbarInstace.from(owner).pause();

        const expectedRevertMessage = "Ownable: caller is not the owner";
        await assert.revertWith(whbarInstace.from(alice).unpause(), expectedRevertMessage);
    });

    it("should set bridge contract address as controller", async () => {
        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );
        const controllerAddress = await whbarInstace.controllerAddress();
        assert.strictEqual(controllerAddress, controller.address, "The bridge address was not set corectly");
    });

    it("should revert if not owner tries to set bridge contract address", async () => {
        const expectedRevertMessage = "Ownable: caller is not the owner";

        await assert.revertWith(whbarInstace.from(alice).setBridgeContractAddress(controller.address), expectedRevertMessage);
    });

    it("should mint tokens from controller", async () => {
        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await whbarInstace.from(controller).mint(alice.address, mintAmount);

        const aliceBalance = await whbarInstace.balanceOf(alice.address);
        assert(aliceBalance.eq(mintAmount));
    });

    it("should revert if not controller tries to mint", async () => {
        const expectedRevertMessage = "WHBAR: Not called by the controller contract";
        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await assert.revertWith(whbarInstace.from(alice).mint(alice.address, mintAmount), expectedRevertMessage);
    });

    it("should burn tokens from controller", async () => {
        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await whbarInstace.from(controller).mint(alice.address, mintAmount);


        const burnAmount = ethers.utils.parseEther("103");
        await whbarInstace.from(alice).approve(controller.address, burnAmount);
        await whbarInstace.from(controller).burnFrom(alice.address, burnAmount);

        const aliceBalance = await whbarInstace.balanceOf(alice.address);
        assert(aliceBalance.eq(mintAmount.sub(burnAmount)));
    });

    it("should revert if not controller tries to burn", async () => {
        const expectedRevertMessage = "WHBAR: Not called by the controller contract";

        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await whbarInstace.from(controller).mint(alice.address, mintAmount);


        const burnAmount = ethers.utils.parseEther("103");
        await whbarInstace.from(alice).approve(controller.address, burnAmount);
        await assert.revertWith(whbarInstace.from(alice).burnFrom(alice.address, burnAmount), expectedRevertMessage);
    });

    it("should revert if there is no allowance", async () => {
        const expectedRevertMessage = "ERC20: burn amount exceeds allowance";

        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await whbarInstace.from(controller).mint(alice.address, mintAmount);


        const burnAmount = ethers.utils.parseEther("103");
        await assert.revertWith(whbarInstace.from(controller).burnFrom(alice.address, burnAmount), expectedRevertMessage);
    });


    it("should not mint if token is paused", async () => {
        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );
        await whbarInstace.from(owner).pause();

        const mintAmount = ethers.utils.parseEther("153");

        const expectedRevertMessage = "ERC20Pausable: token transfer while paused";
        await assert.revertWith(whbarInstace.from(controller).mint(alice.address, mintAmount), expectedRevertMessage);
    });

    it("should not burn if token is paused", async () => {
        await whbarInstace.setBridgeContractAddress(
            controller.address,
        );

        const mintAmount = ethers.utils.parseEther("153");
        await whbarInstace.from(controller).mint(alice.address, mintAmount);

        await whbarInstace.from(owner).pause();

        const expectedRevertMessage = "ERC20Pausable: token transfer while paused";

        const burnAmount = ethers.utils.parseEther("103");
        await whbarInstace.from(alice).approve(controller.address, burnAmount);
        await assert.revertWith(whbarInstace.from(controller).burnFrom(alice.address, burnAmount), expectedRevertMessage);
    });
});
