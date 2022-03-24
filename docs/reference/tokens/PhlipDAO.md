This is an ERC20 token will role-base access control that implements features for external governance.

## Functions

### constructor

```solidity

  function constructor(

  ) public

```

Create contract with initial supply of 5,479,500,000 tokens. Only DEFAULT_ADMIN_ROLE

is assigned because other roles can be assigned later by admin

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

Allow address with MINTER role to mint tokens to a given address

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

### _afterTokenTransfer

```solidity

  function _afterTokenTransfer(

    address from,

    address to,

    uint256 amount

  ) internal

```

Function called after tokens have been transferred. Override of

ERC20._afterTokenTransfer and ERC20Votes._afterTokenTransfer

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`from` | address | The address tokens were transferred from

|`to` | address | The address tokens were transferred  to

|`amount` | uint256 | The amount of tokens transferred

### _mint

```solidity

  function _mint(

    address to,

    uint256 amount

  ) internal

```

Override of ERC20._mint and ERC20Votes._mint

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`to` | address | The address to mint tokens to

|`amount` | uint256 | The amount of tokens to mint

### _burn

```solidity

  function _burn(

    address account,

    uint256 amount

  ) internal

```

Override of ERC20._burn and ERC20Votes._burn

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`account` | address | The address to burn tokens from

|`amount` | uint256 | The amount of tokens to burn
