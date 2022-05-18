// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "../marketing/AffiliateMarketing.sol";

contract AffiliateMarketingMock is AffiliateMarketing {
    bool public didProtectedAction;

    constructor() {
        didProtectedAction = false;
    }

    function campaignExists(uint256 _campaignId) public view returns (bool) {
        return _campaignExists(_campaignId);
    }

    function campaignIsActive(uint256 _campaignId) public view returns (bool) {
        return _campaignIsActive(_campaignId);
    }

    function createCampaign(
        address _owner,
        string memory _uri,
        uint128 _startTime,
        uint128 _endTime,
        uint128 _rewardPercentage
    ) public {
        _createCampaign(_owner, _uri, _startTime, _endTime, _rewardPercentage);
    }

    function updateCampaignOwner(
        uint256 _campaignId,
        address _owner,
        address _newOwner
    ) public {
        _updateCampaignOwner(_campaignId, _owner, _newOwner);
    }

    function addStandardAffiliate(uint256 _campaignId, address _affiliate)
        public
    {
        _addStandardAffiliate(_campaignId, _affiliate);
    }

    function addCustomAffiliate(
        uint256 _campaignId,
        address _affiliate,
        uint128 _customRewardPercentage
    ) public {
        _addCustomAffiliate(_campaignId, _affiliate, _customRewardPercentage);
    }

    function attributeSaleToAffiliate(
        uint256 _campaignId,
        address _affiliate,
        uint256 _saleValue
    ) public {
        _attributeSaleToAffiliate(_campaignId, _affiliate, _saleValue);
    }

    function sendAffiliateReward(uint256 _campaignId, address _affiliate)
        public
    {
        _sendAffiliateReward(_campaignId, _affiliate);
    }
}
