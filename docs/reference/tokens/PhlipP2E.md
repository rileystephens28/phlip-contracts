This is an ERC20 token with role-based access control.

## Functions

### constructor

```solidity

  function constructor(

  ) public

```

Create contract with initial supply of 10,000,000,000 tokens. Only

DEFAULT_ADMIN_ROLE is assigned because other roles can be assigned later by admin

### pause

```solidity

  function pause(

  ) public

```

Allow address with PAUSER role to pause token transfers

### unpause

```solidity

  function unpause(

  ) public

```

Allow address with PAUSER role to unpause token transfers

### mint

```solidity

  function mint(

    address to,

    uint256 amount

  ) public

```

Allow address with MINTER role to mint tokens to a given address

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`to` | address | The address to mint tokens to

|`amount` | uint256 | The amount of tokens to mint

### burn

```solidity

  function burn(

    address account,

    uint256 amount

  ) public

```

Allow address with BURNER role to burn tokens to a given address

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`account` | address | The address holding tokens to burn

|`amount` | uint256 | The amount of tokens to burn

### _beforeTokenTransfer

```solidity

  function _beforeTokenTransfer(

    address from,

    address to,

    uint256 amount

  ) internal

```

Function called before tokens are transferred. Override to make

sure that token tranfers have not been paused

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`from` | address | The address tokens will be transferred from

|`to` | address | The address tokens will be transferred  to

|`amount` | uint256 | The amount of tokens to transfer
