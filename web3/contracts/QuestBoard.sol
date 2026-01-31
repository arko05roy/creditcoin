// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IQuestBoard.sol";
import "./interfaces/ICreditScore.sol";
import "./interfaces/ICrediPet.sol";
import "./interfaces/ILendingPool.sol";

/**
 * @title QuestBoard
 * @notice Gamification layer for the lending protocol
 * @dev Tracks quest completion and awards XP for achievements
 */
contract QuestBoard is IQuestBoard, Ownable {
    // ============ State Variables ============
    
    mapping(uint8 => Quest) private _quests;
    mapping(address => mapping(uint8 => bool)) public completed;
    mapping(address => uint256) public totalXP;
    
    ICreditScore public creditScore;
    ICrediPet public crediPet;
    ILendingPool public lendingPool;
    
    uint8 public constant QUEST_COUNT = 8;
    
    // ============ Constructor ============
    
    constructor(
        address _creditScore,
        address _crediPet,
        address _lendingPool
    ) Ownable(msg.sender) {
        require(_creditScore != address(0), "QuestBoard: zero address");
        require(_crediPet != address(0), "QuestBoard: zero address");
        require(_lendingPool != address(0), "QuestBoard: zero address");
        
        creditScore = ICreditScore(_creditScore);
        crediPet = ICrediPet(_crediPet);
        lendingPool = ILendingPool(_lendingPool);
        
        // Initialize 8 quests
        _quests[0] = Quest("Hatch Your Pet", "Mint your CrediPet", 100);
        _quests[1] = Quest("First Deposit", "Supply CTC to pool", 150);
        _quests[2] = Quest("First Steps", "Borrow your first loan", 150);
        _quests[3] = Quest("Promise Keeper", "Repay a loan on time", 200);
        _quests[4] = Quest("Generous Soul", "Supply at least 0.1 CTC", 200);
        _quests[5] = Quest("Streak Builder", "Repay 3 loans consecutively", 300);
        _quests[6] = Quest("Trust Fall", "Borrow at Juvenile tier or higher", 400);
        _quests[7] = Quest("Legend", "Reach Legendary tier", 500);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Claim a completed quest and receive XP
     * @param questId ID of the quest to claim (0-7)
     */
    function claimQuest(uint8 questId) external {
        require(questId < QUEST_COUNT, "QuestBoard: invalid quest");
        require(!completed[msg.sender][questId], "QuestBoard: already completed");
        require(_validateQuest(msg.sender, QuestId(questId)), "QuestBoard: quest not complete");
        
        completed[msg.sender][questId] = true;
        totalXP[msg.sender] += _quests[questId].xpReward;
        
        emit QuestCompleted(msg.sender, questId, _quests[questId].xpReward, totalXP[msg.sender]);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get quest details
     * @param questId ID of the quest (0-7)
     * @return Quest struct with name, description, and XP reward
     */
    function getQuest(uint8 questId) external view returns (Quest memory) {
        require(questId < QUEST_COUNT, "QuestBoard: invalid quest");
        return _quests[questId];
    }
    
    /**
     * @notice Get completion status of all quests for a user
     * @param user Address to query
     * @return Array of 8 booleans indicating completion status
     */
    function getQuestStatus(address user) external view returns (bool[8] memory) {
        bool[8] memory status;
        for (uint8 i = 0; i < 8; i++) {
            status[i] = completed[user][i];
        }
        return status;
    }
    
    /**
     * @notice Check if a specific quest can be claimed
     * @param user Address to check
     * @param questId Quest to validate
     * @return True if quest conditions are met
     */
    function canClaimQuest(address user, uint8 questId) external view returns (bool) {
        if (questId >= QUEST_COUNT) return false;
        if (completed[user][questId]) return false;
        return _validateQuest(user, QuestId(questId));
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Validate if a user has completed a quest's requirements
     * @param user Address to validate
     * @param questId Quest to check
     * @return True if quest conditions are met
     */
    function _validateQuest(address user, QuestId questId) internal view returns (bool) {
        if (questId == QuestId.HatchPet) {
            // Quest 0: Mint your CrediPet
            return crediPet.hasPet(user);
        } else if (questId == QuestId.FirstDeposit) {
            // Quest 1: Supply CTC to pool
            return lendingPool.deposits(user) > 0;
        } else if (questId == QuestId.FirstBorrow) {
            // Quest 2: Borrow your first loan
            return creditScore.getProfile(user).totalLoans >= 1;
        } else if (questId == QuestId.FirstRepay) {
            // Quest 3: Repay a loan on time
            return creditScore.getProfile(user).totalRepaidOnTime >= 1;
        } else if (questId == QuestId.SupplyLiquidity) {
            // Quest 4: Supply at least 0.1 CTC
            return lendingPool.deposits(user) >= 0.1 ether;
        } else if (questId == QuestId.StreakBuilder) {
            // Quest 5: Repay 3 loans consecutively
            return creditScore.getProfile(user).currentStreak >= 3;
        } else if (questId == QuestId.TrustFall) {
            // Quest 6: Borrow at Juvenile tier (tier 2) or higher
            return creditScore.getCreditTier(user) >= 2;
        } else if (questId == QuestId.Legend) {
            // Quest 7: Reach Legendary tier (tier 4)
            return creditScore.getCreditTier(user) == 4;
        }
        return false;
    }
}
