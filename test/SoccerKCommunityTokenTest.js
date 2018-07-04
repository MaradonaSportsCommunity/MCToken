const BigNumber = require('bignumber.js')
const { addDaysOnEVM, assertRevert } = require('truffle-js-test-helper')
const SoccerKCommunityToken = artifacts.require('./SoccerKCommunityToken.sol')

contract('SoccerKCommunityToken', function(accounts) {
    const owner = accounts[0]
    const admin = accounts[1]
    const user1 = accounts[2]
    const user2 = accounts[3]
    const user3 = accounts[4]
    const user4 = accounts[5]
    
    const TOTAL_SUPPLY = 3e27
    const amount = 10**18

    context("SoccerKCoummunityToken initialization test", async () => {
        before(async () => {
            tokenInstance = await SoccerKCommunityToken.new(admin, {from: owner})
        })

        it("creation: should transfer the ownership correctly", async () => {
            const adminBalance = (await tokenInstance.balanceOf(admin)).toNumber()
            assert.equal(adminBalance, TOTAL_SUPPLY, "the admin should have 3 billion tokens")
        })

        it("creation: should set the token info correctly", async () => {
            const totalSupply = await tokenInstance.totalSupply()
            assert.equal(totalSupply, TOTAL_SUPPLY, "total supply should be 3 billion tokens")

            const name = await tokenInstance.name()
            assert.equal(name, "SoccerK Community Token", "name should be 'SoccerK Community Token'")

            const decimals = await tokenInstance.decimals()
            assert.equal(decimals, 18, "decimal should be 18")

            const symbol = await tokenInstance.symbol()
            assert.equal(symbol, "SKC", "symbol should be 'SKC")
        })
    })

    context("SoccerKCommunityToken transfer test", async () => {
        beforeEach(async () => {
            tokenInstance = await SoccerKCommunityToken.new(admin, {from: owner})
        })

        it ("transfer: should allow admin to transfer", async () => {
            await tokenInstance.transfer(user1, amount, {from: admin})
            const balance1 = (await tokenInstance.balanceOf(user1)).toNumber()
            assert.equal(balance1, amount)
        })

        it ("transfer: should not allow normal user to transfer", async () => {
            await assertRevert(tokenInstance.transfer(user2, amount, { from: user1 }))
        })

        it ("transfer: should allow normal user on the whitelist to transfer", async () => {
            await tokenInstance.addWhitelistedTransfer(user1, {from: admin})
            await tokenInstance.transfer(user1, amount, {from: admin})

            const balance1 = await tokenInstance.balanceOf(user1)
            const balance2 = await tokenInstance.balanceOf(user2)
            await tokenInstance.transfer(user2, amount, {from: user1})
            const _balance1 = await tokenInstance.balanceOf(user1)
            const _balance2 = await tokenInstance.balanceOf(user2)

            assert.equal(_balance1.add(amount).toNumber(), balance1.toNumber(), "user1's balance should be correct")
            assert.equal(_balance2.toNumber(), balance2.add(amount).toNumber(), "user2's balance should be correct")  
        })

        it ("transfer: should allow normal user to transfer correctly after enable transfer", async () => {
            await tokenInstance.activeTransfer({from: admin})
            await tokenInstance.transfer(user3, amount, {from: admin})

            const balance3 = await tokenInstance.balanceOf(user3)
            const balance4 = await tokenInstance.balanceOf(user4)
            await tokenInstance.transfer(user4, amount, {from: user3})
            const _balance3 = await tokenInstance.balanceOf(user3)
            const _balance4 = await tokenInstance.balanceOf(user4)

            assert.equal(_balance3.add(amount).toNumber(), balance3.toNumber(), "user3's balance should be correct")
            assert.equal(_balance4.toNumber(), balance4.add(amount).toNumber(), "user4's balance should be correct") 
        })

        it ("transfer: should allow normal user to batch transfer correctly after enable transfer", async () => {
            await tokenInstance.activeTransfer({from: admin})
            await tokenInstance.transfer(user1, amount * 4, {from: admin})
      
            const balance1 = await tokenInstance.balanceOf(user1)
            const balance2 = await tokenInstance.balanceOf(user2)
            const balance3 = await tokenInstance.balanceOf(user4)
            const balance4 = await tokenInstance.balanceOf(user4)
      
            await tokenInstance.batchTransfer([user2, user3, user4], amount, { from: user1 })
            const _balance1 = await tokenInstance.balanceOf(user1)
            const _balance2 = await tokenInstance.balanceOf(user2)
            const _balance3 = await tokenInstance.balanceOf(user3)
            const _balance4 = await tokenInstance.balanceOf(user4)
      
            assert.equal(balance4.add(amount).toNumber(), _balance4.toNumber())
            assert.equal(balance3.add(amount).toNumber(), _balance3.toNumber())
            assert.equal(balance2.add(amount).toNumber(), _balance2.toNumber())
            assert.equal(balance1.toNumber(), _balance1.add(amount * 3).toNumber())
        })

        it ('transfer: should throw when trying to transfer to 0x0', async () => {
            await assertRevert(tokenInstance.transfer("0x00", amount, {from: admin}))
        })
    })

    context("SoccerKCommunityToken approve test", async () => {
        before(async () => {
            tokenInstance = await SoccerKCommunityToken.new(admin, {from: owner})
        })

        it ("approve: should allow normal account to approve", async () => {
            await tokenInstance.transfer(user1, amount * 2, {from: admin})
            await tokenInstance.approve(user2, amount, {from: user1})
            const allowance = await tokenInstance.allowance(user1, user2)
            assert.equal(allowance.toNumber(), amount)
        })
    })

    context("SoccerKCommunityToken burn test", async () => {
        before(async () => {
            tokenInstance = await SoccerKCommunityToken.new(admin, {from: owner})
        })

        it ("burn: should allow admin to burn correctly", async () => {
            const supply = await tokenInstance.totalSupply()
            await tokenInstance.burn(amount, {from: admin})
            const _supply = await tokenInstance.totalSupply()

            assert.equal(_supply.add(amount).toNumber(), supply.toNumber())
        })

        it ("burn: should not allow normal user to burn", async () => {
            await tokenInstance.transfer(user1, amount * 2, {from: admin})
            await assertRevert(tokenInstance.burn(amount, {from: user1}))
        })
    })
})

