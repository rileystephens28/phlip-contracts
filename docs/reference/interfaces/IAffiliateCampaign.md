
The IAffiliateCampaign interface is used to define the functions
required to allow a contract to manage an affiliate marketing campaign.

## Functions
### createCampaign
```solidity
  function createCampaign(
    address _owner,
    string _name,
    string _description,
    uint256 _rewardsPerAction,
    uint256 _rewardsBudget,
    uint256 _startTime,
    uint256 _endTime
  ) external
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

### registerAffiliate
```solidity
  function registerAffiliate(
    address _address
  ) external
```

Register an address as a new affiliate.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to add to registered affiliates

### deactivateAffiliate
```solidity
  function deactivateAffiliate(
    address _address
  ) external
```

Set existing affiate to inactive in _affiliates

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from registered affiliates

### reactivateAffiliate
```solidity
  function reactivateAffiliate(
    address _address
  ) external
```

Set existing affiate to active in _affiliates

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from registered affiliates

### addToCampaign
```solidity
  function addToCampaign(
    address _affiliate,
    uint256 _campaignId
  ) external
```

Add existing affiliate to existing campaign

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_affiliate` | address | The affiliate address to add to campaign
|`_campaignId` | uint256 | The ID of the campaign to add affiliate to

### removeFromCampaign
```solidity
  function removeFromCampaign(
    address _affiliate,
    uint256 _campaignId
  ) external
```

Remove existing affiliate to existing campaign

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_affiliate` | address | The affiliate address to remove from campaign
|`_campaignId` | uint256 | The ID of the campaign to remove affiliate from

### withdrawRewards
```solidity
  function withdrawRewards(
    uint256 _campaignId
  ) external
```

Remove existing affiliate to existing campaign

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_campaignId` | uint256 | The ID of the campaign to withdraw rewards from

