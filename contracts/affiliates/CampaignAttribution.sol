// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CampaignAttribution
 * @author Riley Stephens
 * @dev Provides the ability to manage a affiliates and attibute actions taken
 * to them. Each affilate agreement can be customized to allow for different actions
 * and rewards. Affiliates can be associated with an abitrary number of agreements.
 *
 * New Design
 * Rewards will be a % of total "sales" rather than a fixed amount per action.
 * Anyone can become an affiliate of the campaign for a fixed 2% of their sales.
 * A priveleged account can add affiliates to the campaign with a custom % agreement.
 */
contract CampaignAttribution {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    Counters.Counter private _campaignIdCounter;

    struct Affiliate {
        bool active;
        uint256 numCampaigns;
        uint256 totalActions;
        uint256 totalRewards;
    }

    /**
     * @dev Represents a real world affiliate marketing campaign that tracks affiliates,
     * actions taken, payouts, and allows for timed campaigns and/or budget caps.
     * @param owner The owner of the campaign
     * @param name The name of the campaign
     * @param description The description of the campaign
     * @param numAffiliates Total number of affiliates participating in the campaign
     * @param numActionsTaken Total number of actions taken by other addresses that are attributed to affiliates
     * @param rewardsPerAction The amount of tokens to be awarded per action taken
     * @param rewardsPaid The amount of tokens already paid out to affiliates
     * @param rewardsBudget The max amount of tokens that can be paid out to affiliates. (Optional if startTime & endTime are specified)
     * @param startTime The time the campaign starts. (Optional if rewardsBudget is specified)
     * @param endTime The time the campaign ends. (Optional if rewardsBudget is specified)
     */
    struct Campaign {
        address owner;
        string name;
        string description;
        uint256 rewardBudget;
        uint256 rewardPerAction;
        uint256 startTime;
        uint256 endTime;
        uint256 numAffiliates;
        uint256 numActionsTaken;
        uint256 totalRewardsPaid;
    }

    mapping(address => Affiliate) private _affiliates;
    mapping(uint256 => Campaign) private _campaigns;

    mapping(address => bool) private _registeredAffiliates; // Tracks registered affiliates addreses
    mapping(uint256 => mapping(address => bool)) private _campaignAffiliates; // Tracks campaign affiliates
    mapping(uint256 => mapping(address => uint256)) private _campaignPayouts; // Tracks campaign payouts to affiliates

    /**
     * @dev Create a new campaign from the given parameters (must have a budget or time range).
     * To create a campaign without a budget use 0 for _rewardsBudget param.
     * To create a campaign without a time range use 0 for _startTime and _endTime params.
     * @param _owner Owner of the campaign
     * @param _name Name of the campaign
     * @param _description Description of the campaign
     * @param _rewardsPerAction The amount of tokens to be awarded per action taken
     * @param _rewardsBudget Max amount of tokens campaign can paid out to affiliates. (Optional if startTime & endTime are specified)
     * @param _startTime The time the campaign starts. (Optional if rewardsBudget is specified)
     * @param _endTime The time the campaign ends. (Optional if rewardsBudget is specified)
     */
    function _createCampaign(
        address _owner,
        string memory _name,
        string memory _description,
        uint256 _rewardsPerAction,
        uint256 _rewardsBudget,
        uint256 _startTime,
        uint256 _endTime
    ) internal virtual {
        require(
            _owner != address(0),
            "CampaignAttribution: Owner cannot be the 0x0 address"
        );
        require(
            bytes(_name).length > 0,
            "CampaignAttribution: Campaign name cannot be empty"
        );
        require(
            _rewardsPerAction > 0,
            "CampaignAttribution: Campaign rewards per action must be greater than 0"
        );
        bool hasBudget = _rewardsBudget > 0;
        bool hasTimeRange = _startTime > 0 && _endTime > 0;
        require(
            hasBudget || hasTimeRange,
            "CampaignAttribution: Campaign must specifiy rewards budget or start and end time"
        );
        if (hasTimeRange) {
            require(
                _startTime >= block.timestamp,
                "CampaignAttribution: Campaign start time cannot be in the past"
            );
            require(
                _startTime < _endTime,
                "CampaignAttribution: Campaign start time must be before end time"
            );
        }
        // Get the current campaign ID and increment
        uint256 campaignId = _campaignIdCounter.current();
        _campaignIdCounter.increment();

        _campaigns[campaignId] = Campaign(
            _owner,
            _name,
            _description,
            _rewardsBudget,
            _rewardsPerAction,
            _startTime,
            _endTime,
            0,
            0,
            0
        );
    }

    /**
     * @dev Register an address as a new affiliate.
     * @param _address The address to add to registered affiliates
     */
    function _registerAffiliate(address _address) internal virtual {
        require(
            _address != address(0),
            "CampaignAttribution: Address cannot be the 0x0 address"
        );
        require(
            !_registeredAffiliates[_address],
            "CampaignAttribution: Affiliate is already registered"
        );
        _registeredAffiliates[_address] = true;

        // Create new affiliate
        _affiliates[_address] = Affiliate(true, 0, 0, 0);
    }

    /**
     * @dev Set existing affiate to inactive in _affiliates
     * @param _address The address to remove from registered affiliates
     */
    function _deactivateAffiliate(address _address) internal virtual {
        Affiliate storage affiliate = _affiliates[_address];
        require(
            affiliate.active,
            "CampaignAttribution: Affiliate is not active"
        );
        affiliate.active = false;
    }

    /**
     * @dev Set existing affiate to active in _affiliates
     * @param _address The address to remove from registered affiliates
     */
    function _reactivateAffiliate(address _address) internal virtual {
        require(
            _registeredAffiliates[_address],
            "CampaignAttribution: Affiliate is not already registered"
        );
        Affiliate storage affiliate = _affiliates[_address];
        require(
            !affiliate.active,
            "CampaignAttribution: Affiliate is already active"
        );
        affiliate.active = true;
    }

    /**
     * @dev Add existing affiliate to existing campaign
     * @param _affiliate The affiliate address to add to campaign
     * @param _campaignId The ID of the campaign to add affiliate to
     */
    function _addAffiliateToCampaign(address _affiliate, uint256 _campaignId)
        internal
        virtual
    {
        require(
            _registeredAffiliates[_affiliate],
            "CampaignAttribution: Affiliate is not registered"
        );
        require(
            !_campaignAffiliates[_campaignId][_affiliate],
            "CampaignAttribution: Affiliate has already been added to campaign"
        );
        Affiliate storage affiliate = _affiliates[_affiliate];
        require(
            affiliate.active,
            "CampaignAttribution: Affiliate is not active"
        );

        // Add affiliate to campaign and increment numAffiliates
        _campaignAffiliates[_campaignId][_affiliate] = true;
        _campaigns[_campaignId].numAffiliates += 1;

        // Increment affiliates numCampaigns
        affiliate.numCampaigns += 1;
    }

    /**
     * @dev Remove existing affiliate to existing campaign
     * @param _affiliate The affiliate address to remove from campaign
     * @param _campaignId The ID of the campaign to remove affiliate from
     */
    function _removeAffiliateFromCampaign(
        address _affiliate,
        uint256 _campaignId
    ) internal virtual {
        require(
            !_campaignAffiliates[_campaignId][_affiliate],
            "CampaignAttribution: Affiliate has not been added to campaign"
        );
        // Remove affiliate from campaign and decrement numAffiliates
        _campaignAffiliates[_campaignId][_affiliate] = false;
        _campaigns[_campaignId].numAffiliates -= 1;

        // Decrement affiliates numCampaigns
        _affiliates[_affiliate].numCampaigns -= 1;
    }
}
