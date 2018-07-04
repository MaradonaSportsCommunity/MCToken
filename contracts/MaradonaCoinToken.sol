pragma solidity 0.4.23;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


/**
 * @title Maradona Coin Token
 * @dev This contract is based on StandardToken, Ownable and Burnable token interface implementation.
 */
contract MaradonaCoinToken is Ownable, BurnableToken, StandardToken {
    using SafeMath for uint256;

    // Constants
    string public constant symbol = "MC";
    string public constant name = "Maradona Coin Token";
    uint256 public constant decimals = 18;
    uint256 public constant INITIAL_SUPPLY = 3000000000 * 10 ** uint256(decimals);

    // Properties
    bool public transferable = false;
    mapping (address => bool) public whitelistedTransfer;

    // Modifiers
    modifier validAddress(address addr) {
        require(addr != address(0x0));
        require(addr != address(this));
        _;
    }
    
    modifier onlyWhenTransferable() {
        if (!transferable) {
            require(whitelistedTransfer[msg.sender]);
        }
        _;
    }
    
    /**
     * @dev Constructor for Maradona Coin Token, assigns the total supply to admin address 
     * @param admin the admin address of SKC
     */
    constructor(address admin) validAddress(admin) public {
        require(msg.sender != admin);
        whitelistedTransfer[admin] = true;
        totalSupply_ = INITIAL_SUPPLY;
        balances[admin] = totalSupply_;
        emit Transfer(address(0x0), admin, totalSupply_);

        transferOwnership(admin);
    }
    
    /**
     * @dev allow owner to add address to whitelist
     * @param _address address to be added
     */
    function addWhitelistedTransfer(address _address) onlyOwner public {
        whitelistedTransfer[_address] = true;
    }

    /**
     * @dev allow owner to batch add addresses to whitelist
     * @param _addresses address list to be added
     */
    function batchAddWhitelistedTransfer(address[] _addresses) onlyOwner public {
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelistedTransfer[_addresses[i]] = true;
        }
    }

    /**
     * @dev allow owner to remove address from whitelist
     * @param _address address to be removed
     */
    function removeWhitelistedTransfer(address _address) onlyOwner public {
        whitelistedTransfer[_address] = false;
    }

    /**
     * @dev allow all users to transfer tokens
     */
    function activeTransfer() onlyOwner public {
        transferable = true;
    }

    /**
     * @dev overrides transfer function with modifier to prevent from transfer with invalid address
     * @param _to The address to transfer to
     * @param _value The amount to be transferred
     */
    function transfer(address _to, uint _value) public 
    validAddress(_to) 
    onlyWhenTransferable
    returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
     * @dev overrides transfer function with modifier to prevent from transfer with invalid address
     * @param _from The address to transfer from.
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     */
    function transferFrom(address _from, address _to, uint _value) public 
    validAddress(_to) 
    onlyWhenTransferable
    returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev overrides transfer function with modifier to prevent from transfer with invalid address
     * @param _recipients An array of address to transfer to.
     * @param _value The amount to be transferred.
     */
    function batchTransfer(address[] _recipients, uint _value) public onlyWhenTransferable returns (bool) {
        uint count = _recipients.length;
        require(count > 0 && count <= 20);
        uint needAmount = count.mul(_value);
        require(_value > 0 && balances[msg.sender] >= needAmount);
        
        for (uint i = 0; i < count; i++) {
            transfer(_recipients[i], _value);
        }
        return true;
    }
    
    /**
     * @dev overrides burn function with modifier to prevent burn while untransferable
     * @param _value The amount to be burned.
     */
    function burn(uint _value) public onlyWhenTransferable onlyOwner {
        super.burn(_value);
    }
}