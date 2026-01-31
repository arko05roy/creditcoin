// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IQuestBoard {
    enum QuestId { 
        HatchPet,           // 0
        FirstDeposit,       // 1
        FirstBorrow,        // 2
        FirstRepay,         // 3
        SupplyLiquidity,    // 4
        StreakBuilder,      // 5
        TrustFall,          // 6
        Legend              // 7
    }

    struct Quest {
        string name;
        string description;
        uint256 xpReward;
    }

    // Events
    event QuestCompleted(address indexed user, uint8 indexed questId, uint256 xpAwarded, uint256 totalXP);

    // View functions
    function getQuest(uint8 questId) external view returns (Quest memory);
    function getQuestStatus(address user) external view returns (bool[8] memory);
    function totalXP(address user) external view returns (uint256);
    
    // State-changing functions
    function claimQuest(uint8 questId) external;
}
