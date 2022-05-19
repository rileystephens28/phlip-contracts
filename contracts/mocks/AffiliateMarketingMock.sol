// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "../marketing/AffiliateMarketing.sol";

contract AffiliateMarketingMock is AffiliateMarketing {
    receive() external payable {}

    function campaignExists(uint256 _campaignId) public view returns (bool) {
        return _campaignExists(_campaignId);
    }

    function campaignIsActive(uint256 _campaignId) public view returns (bool) {
        return _campaignIsActive(_campaignId);
    }

    function createCampaign(
        address _owner,
        uint128 _startTime,
        uint128 _endTime,
        uint32 _standardCommission,
        string memory _uri
    ) public {
        _createCampaign(
            _owner,
            _startTime,
            _endTime,
            _standardCommission,
            _uri
        );
    }

    function updateCampaignMetadata(
        uint256 _campaignId,
        address _owner,
        string memory _uri
    ) public {
        _updateCampaignMetadata(_campaignId, _owner, _uri);
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
        uint32 commission = getCampaign(_campaignId).standardCommission;
        _addAffiliateToCampaign(_campaignId, _affiliate, commission);
    }

    function addCustomAffiliate(
        uint256 _campaignId,
        address _affiliate,
        uint32 _customCommission
    ) public {
        _addAffiliateToCampaign(_campaignId, _affiliate, _customCommission);
    }

    function attributeSaleToAffiliate(
        uint256 _campaignId,
        uint256 _affiliateId,
        uint256 _saleValue
    ) public {
        _attributeSaleToAffiliate(_campaignId, _affiliateId, _saleValue);
    }

    function sendRewardsToAffiliate(uint256 _affiliateId) public {
        _sendRewardsToAffiliate(_affiliateId);
    }
}
