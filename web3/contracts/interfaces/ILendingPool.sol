// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILendingPool {
    struct Loan {
        uint256 principal;
        uint256 collateral;
        uint256 interestRate;
        uint256 borrowBlock;
        uint256 dueBlock;
        bool isActive;
        bool isDefaulted;
    }

    // Events
    event Supplied(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint256 dueBlock);
    event Repaid(address indexed user, uint256 principal, uint256 interest, bool onTime);
    event Liquidated(address indexed borrower, uint256 collateralSeized);

    // View functions
    function deposits(address user) external view returns (uint256);
    function getLoan(address user) external view returns (Loan memory);
    function getRequiredCollateral(address user, uint256 borrowAmount) external view returns (uint256);
    function getPoolStats() external view returns (uint256 totalDeposits, uint256 totalBorrowed, uint256 available);
    
    // State-changing functions
    function supply() external payable;
    function withdraw(uint256 amount) external;
    function borrow(uint256 borrowAmount) external payable;
    function repay() external payable;
    function liquidate(address borrower) external;
}
