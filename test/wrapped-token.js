const etherlime = require("etherlime-lib");
const WrappedToken = require("../build/WrappedToken");
const ethers = require("ethers");

describe("WrappedToken", function () {
    let alice = accounts[1].signer;
    let owner = accounts[9];
    let controller = accounts[8].signer;
    let wrappedTokenInstance;

    const name = "WrapedHBAR";
    const symbol = "WrappedToken";
    const decimals = 8;


    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
        wrappedTokenInstance = await deployer.deploy(
            WrappedToken,
            {},
            name,
            symbol,
            decimals
        );
    });

    it("Should deploy token contract", async () => {
        assert.isAddress(
            wrappedTokenInstance.contractAddress,
            "The contract was not deployed"
        );
        const _owner = await wrappedTokenInstance.owner();
        assert.equal(_owner, owner.signer.address);

        const _decimals = await wrappedTokenInstance.decimals();

        assert.equal(_decimals, decimals);
    });

    it("Should pause the token", async () => {
        await wrappedTokenInstance.from(owner).pause();
        const isPaused = await wrappedTokenInstance.paused();
        assert.ok(isPaused);
    });

    it("Should revert if not owner tries to pause the token", async () => {
        const expectedRevertMessage = "Ownable: caller is not the owner";
        await assert.revertWith(wrappedTokenInstance.from(alice).pause(), expectedRevertMessage);
    });

    it("Should unpause the token", async () => {
        await wrappedTokenInstance.from(owner).pause();

        await wrappedTokenInstance.from(owner).unpause();
        const isPaused = await wrappedTokenInstance.paused();
        assert.ok(!isPaused);
    });

    it("Should revert if not owner tries to unpause the token", async () => {
        await wrappedTokenInstance.from(owner).pause();

        const expectedRevertMessage = "Ownable: caller is not the owner";
        await assert.revertWith(wrappedTokenInstance.from(alice).unpause(), expectedRevertMessage);
    });

    it("Should set bridge contract address as controller", async () => {
        await wrappedTokenInstance.setController(
            controller.address
        );
        const controllerAddress = await wrappedTokenInstance.controller();
        assert.strictEqual(controllerAddress, controller.address, "The bridge address was not set corectly");
    });

    it("Should emit ControllerAddressSet event", async () => {
        const expectedEvent = "ControllerSet";
        await assert.emit(wrappedTokenInstance.setController(controller.address), expectedEvent);
    });

    it("Should emit ControllerAddressSet event arguments", async () => {
        const expectedEvent = "ControllerSet";
        const expectedEventArgs = [controller.address];
        await assert.emitWithArgs(wrappedTokenInstance.setController(controller.address), expectedEvent, expectedEventArgs);
    });

    it("Should revert if not owner tries to set bridge contract address", async () => {
        const expectedRevertMessage = "Ownable: caller is not the owner";

        await assert.revertWith(wrappedTokenInstance.from(alice).setController(controller.address), expectedRevertMessage);
    });

    it("Should mint tokens from controller", async () => {
        await wrappedTokenInstance.setController(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await wrappedTokenInstance.from(controller).mint(alice.address, mintAmount);

        const aliceBalance = await wrappedTokenInstance.balanceOf(alice.address);
        assert(aliceBalance.eq(mintAmount));
    });

    it("Should revert if not controller tries to mint", async () => {
        const expectedRevertMessage = "WrappedToken: Not called by the controller contract";
        await wrappedTokenInstance.setController(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await assert.revertWith(wrappedTokenInstance.from(alice).mint(alice.address, mintAmount), expectedRevertMessage);
    });

    it("Should burn tokens from controller", async () => {
        await wrappedTokenInstance.setController(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await wrappedTokenInstance.from(controller).mint(alice.address, mintAmount);


        const burnAmount = ethers.utils.parseEther("103");
        await wrappedTokenInstance.from(alice).approve(controller.address, burnAmount);
        await wrappedTokenInstance.from(controller).burnFrom(alice.address, burnAmount);

        const aliceBalance = await wrappedTokenInstance.balanceOf(alice.address);
        assert(aliceBalance.eq(mintAmount.sub(burnAmount)));
    });

    it("Should revert if not controller tries to burn", async () => {
        const expectedRevertMessage = "WrappedToken: Not called by the controller contract";

        await wrappedTokenInstance.setController(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await wrappedTokenInstance.from(controller).mint(alice.address, mintAmount);


        const burnAmount = ethers.utils.parseEther("103");
        await wrappedTokenInstance.from(alice).approve(controller.address, burnAmount);
        await assert.revertWith(wrappedTokenInstance.from(alice).burnFrom(alice.address, burnAmount), expectedRevertMessage);
    });

    it("Should revert if there is no allowance", async () => {
        const expectedRevertMessage = "ERC20: burn amount exceeds allowance";

        await wrappedTokenInstance.setController(
            controller.address,
        );
        const mintAmount = ethers.utils.parseEther("153");
        await wrappedTokenInstance.from(controller).mint(alice.address, mintAmount);


        const burnAmount = ethers.utils.parseEther("103");
        await assert.revertWith(wrappedTokenInstance.from(controller).burnFrom(alice.address, burnAmount), expectedRevertMessage);
    });


    it("Should not mint if token is paused", async () => {
        await wrappedTokenInstance.setController(
            controller.address,
        );
        await wrappedTokenInstance.from(owner).pause();

        const mintAmount = ethers.utils.parseEther("153");

        const expectedRevertMessage = "ERC20Pausable: token transfer while paused";
        await assert.revertWith(wrappedTokenInstance.from(controller).mint(alice.address, mintAmount), expectedRevertMessage);
    });

    it("Should not burn if token is paused", async () => {
        await wrappedTokenInstance.setController(
            controller.address,
        );

        const mintAmount = ethers.utils.parseEther("153");
        await wrappedTokenInstance.from(controller).mint(alice.address, mintAmount);

        await wrappedTokenInstance.from(owner).pause();

        const expectedRevertMessage = "ERC20Pausable: token transfer while paused";

        const burnAmount = ethers.utils.parseEther("103");
        await wrappedTokenInstance.from(alice).approve(controller.address, burnAmount);
        await assert.revertWith(wrappedTokenInstance.from(controller).burnFrom(alice.address, burnAmount), expectedRevertMessage);
    });
});
