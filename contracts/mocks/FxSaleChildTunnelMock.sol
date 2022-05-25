// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "../sale/FxSaleChildTunnel.sol";

contract FxSaleChildTunnelMock is FxSaleChildTunnel {
    constructor(
        address _pcAddress,
        address _wcAddress,
        address _daoToken,
        address _p2eToken,
        address _daoWallet,
        address _p2eWallet,
        uint256 _cliff,
        uint256 _duration,
        address _fxChild
    )
        FxSaleChildTunnel(
            _pcAddress,
            _wcAddress,
            _daoToken,
            _p2eToken,
            _daoWallet,
            _p2eWallet,
            _cliff,
            _duration,
            _fxChild
        )
    {}

    function receiveCardPurchaseMessage(
        uint256 stateId,
        address sender,
        address purchaser,
        uint128 cardId
    ) public {
        _processMessageFromRoot(
            stateId,
            sender,
            _craftCardPurchaseMessage(purchaser, cardId)
        );
    }

    function receivePackagePurchaseMessage(
        uint256 stateId,
        address sender,
        address purchaser,
        uint256 pkgId
    ) public {
        _processMessageFromRoot(
            stateId,
            sender,
            _craftPackagePurchaseMessage(purchaser, pkgId)
        );
    }

    function invokeCardPurchase(address purchaser, uint128 cardId) public {
        _executeCardPurchase(_craftCardPurchaseMessage(purchaser, cardId));
    }

    function invokePackagePurchase(address purchaser, uint256 pkgId) public {
        _executePackagePurchase(_craftPackagePurchaseMessage(purchaser, pkgId));
    }

    function _craftCardPurchaseMessage(address purchaser, uint128 cardId)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(PURCHASE_CARD, abi.encode(purchaser, cardId));
    }

    function _craftPackagePurchaseMessage(address purchaser, uint256 pkgId)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(PURCHASE_PACKAGE, abi.encode(purchaser, pkgId));
    }
}
