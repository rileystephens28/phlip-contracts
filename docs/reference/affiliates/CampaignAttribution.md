
Provides the ability to manage a affiliates and attibute actions taken
to them. Each affilate agreement can be customized to allow for different actions
and rewards. Affiliates can be associated with an abitrary number of agreements.

## Functions
### _createCampaign
```solidity
  function _createCampaign(
    address _owner,
    string _name,
    string _description,
    uint256 _rewardsPerAction,
    uint256 _rewardsBudget,
    uint256 _startTime,
    uint256 _endTime
  ) internal
```

Create a new campaign from the given parameters (must have a budget or time range).
To create a campaign without a budget use 0 for _rewardsBudget param.
To create a campaign without a time range use 0 for _startTime and _endTime params.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | address | Owner of the campaign
|`_name` | string | Name of the campaign
|`_description` | string | Description of the campaign
|`_rewardsPerAction` | uint256 | The amount of tokens to be awarded per action taken
|`_rewardsBudget` | uint256 | Max amount of tokens campaign can paid out to affiliates. (Optional if startTime & endTime are specified)
|`_startTime` | uint256 | The time the campaign starts. (Optional if rewardsBudget is specified)
|`_endTime` | uint256 | The time the campaign ends. (Optional if rewardsBudget is specified)

### _registerAffiliate
```solidity
  function _registerAffiliate(
    address _address
  ) internal
```

Register an address as a new affiliate.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to add to registered affiliates

### _deactivateAffiliate
```solidity
  function _deactivateAffiliate(
    address _address
  ) internal
```

Set existing affiate to inactive in _affiliates

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from registered affiliates

### _reactivateAffiliate
```solidity
  function _reactivateAffiliate(
    address _address
  ) internal
```

Set existing affiate to active in _affiliates

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from registered affiliates

### _addAffiliateToCampaign
```solidity
  function _addAffiliateToCampaign(
    address _affiliate,
    uint256 _campaignId
  ) internal
```

Add existing affiliate to existing campaign

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_affiliate` | address | The affiliate address to add to campaign
|`_campaignId` | uint256 | The ID of the campaign to add affiliate to

### _removeAffiliateFromCampaign
```solidity
  function _removeAffiliateFromCampaign(
    address _affiliate,
    uint256 _campaignId
  ) internal
```

Remove existing affiliate to existing campaign

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_affiliate` | address | The affiliate address to remove from campaign
|`_campaignId` | uint256 | The ID of the campaign to remove affiliate from

