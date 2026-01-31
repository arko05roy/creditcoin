// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICreditScore.sol";
import "./interfaces/ICrediPet.sol";

/**
 * @title CreditScore
 * @notice Core credit reputation engine that tracks user credit history
 * @dev Manages tier upgrades, collateral ratios, and interest rates
 */
contract CreditScore is ICreditScore, Ownable {
    // ============ State Variables ============
    
    mapping(address => CreditProfile) public profiles;
    
    // Tier requirements (repayments needed to reach each tier)
    uint256[5] public tierThresholds = [0, 1, 3, 7, 15];
    
    // Collateral ratios in basis points (10000 = 100%)
    uint256[5] public collateralRatios = [15000, 13000, 11000, 8500, 6000]; // 150%, 130%, 110%, 85%, 60%
    
    // Interest rates in basis points per loan period
    uint256[5] public interestRates = [500, 400, 300, 200, 100]; // 5%, 4%, 3%, 2%, 1%
    
    ICrediPet public crediPet;
    address public lendingPool;
    
    // ============ Modifiers ============
    
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "CreditScore: caller is not LendingPool");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _crediPet) Ownable(msg.sender) {
        require(_crediPet != address(0), "CreditScore: zero address");
        crediPet = ICrediPet(_crediPet);
    }
    
    // ============ External Functions - Called by LendingPool ============
    
    /**
     * @notice Record an on-time loan repayment
     * @param user Address of the borrower
     */
    function recordRepayment(address user) external onlyLendingPool {
        CreditProfile storage profile = profiles[user];
        
        profile.totalRepaidOnTime++;
        profile.currentStreak++;
        
        // Check for tier upgrade
        _checkTierUpgrade(user);
        
        // If user's pet was weakened, heal it
        if (crediPet.hasPet(user)) {
            ICrediPet.Pet memory pet = crediPet.getPet(crediPet.petOfOwner(user));
            if (pet.isWeakened) {
                crediPet.setWeakened(user, false);
            }
        }
        
        emit RepaymentRecorded(user, profile.totalRepaidOnTime);
    }
    
    /**
     * @notice Record a loan default or late payment
     * @param user Address of the borrower
     */
    function recordDefault(address user) external onlyLendingPool {
        CreditProfile storage profile = profiles[user];
        
        profile.totalDefaulted++;
        profile.currentStreak = 0;
        
        // Weaken the pet if it exists
        if (crediPet.hasPet(user)) {
            crediPet.setWeakened(user, true);
        }
        
        emit DefaultRecorded(user, profile.totalDefaulted);
    }
    
    /**
     * @notice Record a new loan being taken
     * @param user Address of the borrower
     */
    function recordLoanTaken(address user) external onlyLendingPool {
        CreditProfile storage profile = profiles[user];
        profile.totalLoans++;
        
        emit LoanRecorded(user, profile.totalLoans);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get the complete credit profile for a user
     * @param user Address to query
     * @return CreditProfile struct
     */
    function getProfile(address user) external view returns (CreditProfile memory) {
        return profiles[user];
    }
    
    /**
     * @notice Get the current credit tier for a user
     * @param user Address to query
     * @return Tier level (0-4)
     */
    function getCreditTier(address user) external view returns (uint8) {
        return profiles[user].currentTier;
    }
    
    /**
     * @notice Get the collateral ratio for a user's tier
     * @param user Address to query
     * @return Collateral ratio in basis points
     */
    function getCollateralRatio(address user) external view returns (uint256) {
        return collateralRatios[profiles[user].currentTier];
    }
    
    /**
     * @notice Get the interest rate for a user's tier
     * @param user Address to query
     * @return Interest rate in basis points
     */
    function getInterestRate(address user) external view returns (uint256) {
        return interestRates[profiles[user].currentTier];
    }
    
    /**
     * @notice Get tier thresholds array
     * @return Array of repayment thresholds for each tier
     */
    function getTierThresholds() external view returns (uint256[5] memory) {
        return tierThresholds;
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Check if user qualifies for tier upgrade and execute if so
     * @param user Address to check
     * @return True if user was upgraded
     */
    function _checkTierUpgrade(address user) internal returns (bool) {
        CreditProfile storage profile = profiles[user];
        uint8 currentTier = profile.currentTier;
        
        // Already at max tier
        if (currentTier == 4) {
            return false;
        }
        
        uint8 nextTier = currentTier + 1;
        
        // Check if eligible for next tier
        bool eligible = false;
        
        if (nextTier == 4) {
            // Legendary tier: requires 15 repayments AND zero defaults
            eligible = profile.totalRepaidOnTime >= tierThresholds[4] && 
                      profile.totalDefaulted == 0;
        } else {
            // Other tiers: just check repayment threshold
            eligible = profile.totalRepaidOnTime >= tierThresholds[nextTier];
        }
        
        if (eligible) {
            profile.currentTier = nextTier;
            
            // Evolve the pet if it exists
            if (crediPet.hasPet(user)) {
                crediPet.evolve(user, nextTier);
            }
            
            emit CreditTierUpgraded(user, currentTier, nextTier);
            return true;
        }
        
        return false;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set the lending pool contract address
     * @param _lendingPool Address of the LendingPool contract
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "CreditScore: zero address");
        lendingPool = _lendingPool;
    }
    
    /**
     * @notice Update collateral ratio for a specific tier
     * @param tier Tier level (0-4)
     * @param ratio New collateral ratio in basis points
     */
    function setCollateralRatio(uint8 tier, uint256 ratio) external onlyOwner {
        require(tier <= 4, "CreditScore: invalid tier");
        require(ratio >= 1000 && ratio <= 20000, "CreditScore: ratio out of bounds");
        collateralRatios[tier] = ratio;
    }
    
    /**
     * @notice Update interest rate for a specific tier
     * @param tier Tier level (0-4)
     * @param rate New interest rate in basis points
     */
    function setInterestRate(uint8 tier, uint256 rate) external onlyOwner {
        require(tier <= 4, "CreditScore: invalid tier");
        require(rate <= 1000, "CreditScore: rate too high"); // Max 10%
        interestRates[tier] = rate;
    }
    
    /**
     * @notice Update tier threshold
     * @param tier Tier level (0-4)
     * @param threshold New repayment threshold
     */
    function setTierThreshold(uint8 tier, uint256 threshold) external onlyOwner {
        require(tier <= 4, "CreditScore: invalid tier");
        tierThresholds[tier] = threshold;
    }
}
