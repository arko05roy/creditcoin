// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICreditScore {
    struct CreditProfile {
        uint256 totalLoans;
        uint256 totalRepaidOnTime;
        uint256 totalDefaulted;
        uint256 currentStreak;
        uint8 currentTier;
    }

    // Events
    event RepaymentRecorded(address indexed user, uint256 totalRepaid);
    event DefaultRecorded(address indexed user, uint256 totalDefaults);
    event LoanRecorded(address indexed user, uint256 totalLoans);
    event CreditTierUpgraded(address indexed user, uint8 oldTier, uint8 newTier);

    // View functions
    function getProfile(address user) external view returns (CreditProfile memory);
    function getCreditTier(address user) external view returns (uint8);
    function getCollateralRatio(address user) external view returns (uint256);
    function getInterestRate(address user) external view returns (uint256);
    function getTierThresholds() external view returns (uint256[5] memory);
    
    // State-changing functions
    function recordRepayment(address user) external;
    function recordDefault(address user) external;
    function recordLoanTaken(address user) external;
}
