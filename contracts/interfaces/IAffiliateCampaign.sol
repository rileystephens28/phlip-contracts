// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title IAffiliateCampaign
 * @author Riley Stephens
 * @dev The IAffiliateCampaign interface is used to define the functions
 * required to allow a contract to manage an affiliate marketing campaign.
 */
interface IAffiliateCampaign {
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
    function createCampaign(
        address _owner,
        string memory _name,
        string memory _description,
        uint256 _rewardsPerAction,
        uint256 _rewardsBudget,
        uint256 _startTime,
        uint256 _endTime
    ) external;

    /**
     * @dev Register an address as a new affiliate.
     * @param _address The address to add to registered affiliates
     */
    function registerAffiliate(address _address) external;

    /**
     * @dev Set existing affiate to inactive in _affiliates
     * @param _address The address to remove from registered affiliates
     */
    function deactivateAffiliate(address _address) external;

    /**
     * @dev Set existing affiate to active in _affiliates
     * @param _address The address to remove from registered affiliates
     */
    function reactivateAffiliate(address _address) external;

    /**
     * @dev Add existing affiliate to existing campaign
     * @param _affiliate The affiliate address to add to campaign
     * @param _campaignId The ID of the campaign to add affiliate to
     */
    function addToCampaign(address _affiliate, uint256 _campaignId) external;

    /**
     * @dev Remove existing affiliate to existing campaign
     * @param _affiliate The affiliate address to remove from campaign
     * @param _campaignId The ID of the campaign to remove affiliate from
     */
    function removeFromCampaign(address _affiliate, uint256 _campaignId)
        external;

    /**
     * @dev Remove existing affiliate to existing campaign
     * @param _campaignId The ID of the campaign to withdraw rewards from
     */
    function withdrawRewards(uint256 _campaignId) external;
}
