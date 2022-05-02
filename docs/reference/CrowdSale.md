## Bundled White Text Package Indexes
    whiteText1 = 0;
    whiteText2 = 1;
    whiteText3 = 2;
    whiteText5 = 3;
    whiteText10 = 4;
    whiteText20 = 5;

## Bundled Pink Text Package Indexes
    pinkText1 = 6;
    pinkText2 = 7;
    pinkText3 = 8;

## Bundled Pink Image Package Indexes
    pinkImage1 = 9;
    pinkImage2 = 10;
    pinkImage3 = 11;

## Bundled Pink Combo Package Indexes
    pinkCombo1 = 12;
    pinkCombo2 = 13;
    pinkCombo3 = 14;

## Full House Package Indexes
    fullHouse = 6;
    doubleFullHouse = 7;
    tripleFullHouse = 8;

## Whale Package Indexes
    belugaWhale = 9;
    humpbackWhale = 10;
    blueWhale = 11;


## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### presaleActive
```solidity
  function presaleActive(
  ) public returns (bool)
```

Getter for presale active state.


### priceOf
```solidity
  function priceOf(
    uint256 _packageID
  ) public returns (uint256)
```

Getter for the price in WEI of a presale package.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_packageID` | uint256 | ID of the package to query

### getPackagesRemaining
```solidity
  function getPackagesRemaining(
    uint256 _packageID
  ) public returns (uint128)
```

Getter for number of remaining presale packages available for sale

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_packageID` | uint256 | ID of the package to query

### getCardBundles
```solidity
  function getCardBundles(
    uint256 _packageID
  ) public returns (struct PhlipSale.CardBundle[])
```

Getter for number of remaining presale packages available for sale

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_packageID` | uint256 | ID of the package to query

### maxSupplyOf
```solidity
  function maxSupplyOf(
    uint128 _cardID
  ) public returns (uint128)
```

Getter for max supply of a specific card.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint128 | ID of the card to query

### mintedSupplyOf
```solidity
  function mintedSupplyOf(
    uint128 _cardID
  ) public returns (uint128)
```

Getter for number of minted cards of a specific color & type.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint128 | ID of the card to query

### setPresaleActive
```solidity
  function setPresaleActive(
    bool _active
  ) public
```

Allows contract owner to set presale active state.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_active` | bool | New presale active state.

### createSingleCardPackage
```solidity
  function createSingleCardPackage(
    uint256 _packageID,
    uint256 _weiPrice,
    uint128 _numForSale,
    uint128 _numCards,
    uint128 _cardID,
    uint256 _daoAmount,
    uint256 _p2eAmount
  ) public
```

Allows contract owner to create a presale package that contains 1 card type

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_packageID` | uint256 | ID of the package to create (or overwrite)
|`_weiPrice` | uint256 | The price of the package in wei
|`_numForSale` | uint128 | Number of packages that can be bought
|`_numCards` | uint128 | Number of cards in the package
|`_cardID` | uint128 | ID of the card in the package (can be 0-3)
|`_daoAmount` | uint256 | The amount of DAO tokens that will vest in card
|`_p2eAmount` | uint256 | The amount of P2E tokens that will vest in card

### createMultiCardPackage
```solidity
  function createMultiCardPackage(
    uint256 _packageID,
    uint256 _weiPrice,
    uint128 _numForSale,
    uint128[] _cardIDs,
    uint128[] _numCards,
    uint256[] _daoAmounts,
    uint256[] _p2eAmounts
  ) public
```

Allows contract owner to create a presale package that contains 1 card type

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_packageID` | uint256 | ID of the package to create (or overwrite)
|`_weiPrice` | uint256 | The price of the package in wei
|`_numForSale` | uint128 | Number of packages that can be bought
|`_cardIDs` | uint128[] | Array of IDs of the card in the package (can be 0-3)
|`_numCards` | uint128[] | Array containing number of each card in the package
|`_daoAmounts` | uint256[] | Array containing the amount of DAO tokens that will vest in each card
|`_p2eAmounts` | uint256[] | Array containing the amount of P2E tokens that will vest in each card

### purchasePackage
```solidity
  function purchasePackage(
    uint256 _packageID
  ) public
```

Allows caller to purchase a presale package if they
have sent the correct amount of ETH to cover the package cost.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_packageID` | uint256 | ID of the package to purchase.

## Events
### CreatePackage
```solidity
  event CreatePackage(
  )
```



### PurchasePackage
```solidity
  event PurchasePackage(
  )
```



