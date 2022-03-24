Prevents ETH or Tokens from getting stuck in a contract by allowing

the Owner/DAO to pull them out on behalf of a user. This is only meant to used by

contracts that are not expected to hold tokens, but do handle transferring them.

## Functions

### _withdrawEther

```solidity

  function _withdrawEther(

  ) internal

```

### _withdrawERC20

```solidity

  function _withdrawERC20(

  ) internal

```

### _withdrawERC721

```solidity

  function _withdrawERC721(

  ) internal

```

## Events

### WithdrawStuckEther

```solidity

  event WithdrawStuckEther(

  )

```

### WithdrawStuckERC20

```solidity

  event WithdrawStuckERC20(

  )

```

### WithdrawStuckERC721

```solidity

  event WithdrawStuckERC721(

  )

```
