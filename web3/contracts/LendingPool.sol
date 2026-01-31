// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/ICreditScore.sol";

/**
 * @title LendingPool
 * @notice Lending pool with credit-based collateral requirements
 * @dev Integrates with CreditScore for dynamic collateral ratios
 */
contract LendingPool is ILendingPool, Ownable, ReentrancyGuard {
    // ============ State Variables ============
    
    mapping(address => Loan) private _loans;
    mapping(address => uint256) public deposits;
    
    uint256 public totalDeposits;
    uint256 public totalBorrowed;
    uint256 public loanDurationBlocks = 50; // ~10 minutes for demo
    
    ICreditScore public creditScore;
    
    uint256 public constant GRACE_PERIOD = 25;
    uint256 public constant MIN_BORROW = 0.001 ether;
    uint256 public constant MAX_BORROW = 10 ether;
    uint256 public constant BASIS_POINTS = 10000;
    
    // ============ Constructor ============
    
    constructor(address _creditScore) Ownable(msg.sender) {
        require(_creditScore != address(0), "LendingPool: zero address");
        creditScore = ICreditScore(_creditScore);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Supply CTC to the pool
     * @dev Increases user's deposit balance and total pool deposits
     */
    function supply() external payable nonReentrant {
        require(msg.value > 0, "LendingPool: zero amount");
        
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Supplied(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw CTC from pool
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(deposits[msg.sender] >= amount, "LendingPool: insufficient balance");
        require(getAvailableLiquidity() >= amount, "LendingPool: insufficient liquidity");
        
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "LendingPool: transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Borrow CTC with credit-based collateral
     * @param borrowAmount Amount to borrow
     * @dev Collateral required depends on user's credit tier
     */
    function borrow(uint256 borrowAmount) external payable nonReentrant {
        require(!_loans[msg.sender].isActive, "LendingPool: active loan exists");
        require(borrowAmount >= MIN_BORROW && borrowAmount <= MAX_BORROW, "LendingPool: invalid amount");
        require(getAvailableLiquidity() >= borrowAmount, "LendingPool: insufficient liquidity");
        
        uint256 collateralRatio = creditScore.getCollateralRatio(msg.sender);
        uint256 requiredCollateral = (borrowAmount * collateralRatio) / BASIS_POINTS;
        require(msg.value >= requiredCollateral, "LendingPool: insufficient collateral");
        
        uint256 interestRate = creditScore.getInterestRate(msg.sender);
        
        _loans[msg.sender] = Loan({
            principal: borrowAmount,
            collateral: msg.value,
            interestRate: interestRate,
            borrowBlock: block.number,
            dueBlock: block.number + loanDurationBlocks,
            isActive: true,
            isDefaulted: false
        });
        
        totalBorrowed += borrowAmount;
        creditScore.recordLoanTaken(msg.sender);
        
        (bool success, ) = msg.sender.call{value: borrowAmount}("");
        require(success, "LendingPool: transfer failed");
        
        emit Borrowed(msg.sender, borrowAmount, msg.value, block.number + loanDurationBlocks);
    }
    
    /**
     * @notice Repay loan
     * @dev Returns collateral and records repayment status in CreditScore
     */
    function repay() external payable nonReentrant {
        Loan storage loan = _loans[msg.sender];
        require(loan.isActive, "LendingPool: no active loan");
        
        uint256 interest = (loan.principal * loan.interestRate) / BASIS_POINTS;
        uint256 totalOwed = loan.principal + interest;
        require(msg.value >= totalOwed, "LendingPool: insufficient repayment");
        
        bool onTime = block.number <= loan.dueBlock;
        
        // Return collateral
        uint256 collateralToReturn = loan.collateral;
        
        // Update state before external calls (CEI pattern)
        loan.isActive = false;
        totalBorrowed -= loan.principal;
        
        // Record in credit score
        if (onTime) {
            creditScore.recordRepayment(msg.sender);
        } else {
            creditScore.recordDefault(msg.sender);
        }
        
        // Transfer collateral back
        (bool success, ) = msg.sender.call{value: collateralToReturn}("");
        require(success, "LendingPool: collateral return failed");
        
        // Refund excess payment
        if (msg.value > totalOwed) {
            (success, ) = msg.sender.call{value: msg.value - totalOwed}("");
            require(success, "LendingPool: refund failed");
        }
        
        emit Repaid(msg.sender, loan.principal, interest, onTime);
    }
    
    /**
     * @notice Liquidate overdue loan
     * @param borrower Address of the borrower to liquidate
     * @dev Only callable after grace period expires
     */
    function liquidate(address borrower) external nonReentrant {
        Loan storage loan = _loans[borrower];
        require(loan.isActive, "LendingPool: no active loan");
        require(block.number > loan.dueBlock + GRACE_PERIOD, "LendingPool: grace period active");
        
        uint256 collateralSeized = loan.collateral;
        
        // Update state before external calls (CEI pattern)
        loan.isActive = false;
        loan.isDefaulted = true;
        totalBorrowed -= loan.principal;
        totalDeposits += collateralSeized; // Add to pool
        
        creditScore.recordDefault(borrower);
        
        emit Liquidated(borrower, collateralSeized);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get required collateral for a borrow amount
     * @param user Address of the borrower
     * @param borrowAmount Amount to borrow
     * @return Required collateral amount
     */
    function getRequiredCollateral(address user, uint256 borrowAmount) external view returns (uint256) {
        uint256 ratio = creditScore.getCollateralRatio(user);
        return (borrowAmount * ratio) / BASIS_POINTS;
    }
    
    /**
     * @notice Get pool statistics
     * @return totalDeposits Total deposits in pool
     * @return totalBorrowed Total borrowed from pool
     * @return available Available liquidity
     */
    function getPoolStats() external view returns (uint256, uint256, uint256) {
        return (totalDeposits, totalBorrowed, getAvailableLiquidity());
    }
    
    /**
     * @notice Get available liquidity in the pool
     * @return Available amount to borrow
     */
    function getAvailableLiquidity() public view returns (uint256) {
        return totalDeposits >= totalBorrowed ? totalDeposits - totalBorrowed : 0;
    }
    
    /**
     * @notice Get loan details for a user
     * @param user Address of the borrower
     * @return Loan struct
     */
    function getLoan(address user) external view returns (Loan memory) {
        return _loans[user];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set loan duration in blocks
     * @param blocks Number of blocks for loan duration
     */
    function setLoanDuration(uint256 blocks) external onlyOwner {
        loanDurationBlocks = blocks;
    }
}
