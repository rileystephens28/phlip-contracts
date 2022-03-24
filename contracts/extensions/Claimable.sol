// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title Claimable
 * @author Riley Stephens
 * @dev A Claim represents an asset(s) IOU that can be redeemed
 * by an address. Claims allow contracts to track the ownership of
 * NF assets that are intended to be minted at a later date.
 */
contract Claimable {
    struct Claim {
        uint256[] assetIds;
        uint256 remainingAmount;
    }

    mapping(address => bool) private _beneficiaries;
    mapping(address => Claim) private _claims;
    mapping(uint256 => address) private _assetBeneficiaries;

    /**
     * @dev Require msg.sender to be a beneficiary and reverts if not
     */
    modifier onlyBeneficiary() {
        require(
            _beneficiaries[msg.sender],
            "Claimable: Address is not a beneficiary"
        );
        _;
    }

    /**
     * @dev Require address to have claim of an asset and reverts if not
     * @param _assetID The ID of an asset
     */
    modifier onlyClaimer(uint256 _assetID) {
        require(
            _assetBeneficiaries[_assetID] == msg.sender,
            "Claimable: Address is not the beneficiary of asset ID"
        );
        _;
    }

    /**
     * @dev Require address to have at least 1 claim and reverts if not.
     * @param _address The address to check.
     */
    modifier claimExists(address _address) {
        require(_beneficiaries[_address], "Claimable: Claim does not exist.");
        _;
    }

    /**
     * @dev Helper function to check if an address has a claim
     * @param _address The address to check.
     * @return Whether or not the address has a claim.
     */
    function hasClaim(address _address) public view returns (bool) {
        return _beneficiaries[_address];
    }

    /**
     * @dev Helper to get number of claims for an address.
     * @param _address Beneficiary address of the claim.
     * @return Number of claims for an address.
     */
    function remainingClaims(address _address)
        public
        view
        virtual
        returns (uint256)
    {
        return _claims[_address].remainingAmount;
    }

    /**
     * @dev Accessor method to get the first available ID in the list of address's claims.
     * @param _address Address that has >= 1 claim(s).
     * @return The first asset ID in the array of claims.
     */
    function nextClaimableID(address _address)
        public
        view
        virtual
        claimExists(_address)
        returns (uint256)
    {
        return _claims[_address].assetIds[0];
    }

    /**
     * @dev Accessor method to get the asset ID at a specific index in the list of address's claims.
     * @param _address Address that has >= 1 claim(s).
     * @return The asset ID at specified position in the array of claims.
     */
    function getClaimableID(address _address, uint256 _index)
        public
        view
        virtual
        claimExists(_address)
        returns (uint256)
    {
        require(
            _index < _claims[_address].remainingAmount,
            "Claimable.getClaimableID: Asset index out of bounds"
        );
        return _claims[_address].assetIds[_index];
    }

    /**
     * @dev Creates a claim for an address that does not already have one.
     * The asset IDs being registered in the claim cannot appear in any other claims.
     * @param _beneficiary Address to create claim for.
     * @param _assetIds Array of IDs representing outside assets that can be claimed.
     */
    function _createClaim(address _beneficiary, uint256[] memory _assetIds)
        internal
        virtual
    {
        // Add address to beneficiaries
        require(
            !_beneficiaries[_beneficiary],
            "Claimable._createClaim: Claim has already been created for this address. Call _updateClaim() for existing beneficiaries."
        );
        _beneficiaries[_beneficiary] = true;

        // Register asset beneficiaries
        for (uint256 i = 0; i < _assetIds.length; i++) {
            require(
                _assetBeneficiaries[_assetIds[i]] == address(0),
                "Claimable._createClaim: Asset ID has already been claimed."
            );
            _assetBeneficiaries[_assetIds[i]] = _beneficiary;
        }

        // Create new claim
        _claims[_beneficiary] = Claim(_assetIds, _assetIds.length);
    }

    /**
     * @dev Appends an ID to an existing claim's assetIds.
     * The ID cannot appear in any other claims.
     * @param _address Address with an existing claim.
     * @param _assetId ID to add to assetIds.
     */
    function _addToClaim(address _address, uint256 _assetId)
        internal
        virtual
        claimExists(_address)
    {
        require(
            _assetBeneficiaries[_assetId] == address(0),
            "Claimable._addToClaim: Asset ID has already been claimed."
        );
        Claim storage claim = _claims[_address];
        claim.assetIds.push(_assetId);
        claim.remainingAmount += 1;
    }

    /**
     * @dev Removes an asset at a specified index from
     * an existing claim. If the claim is fully redeemed after
     * the asset is removed, the claim is deleted.
     * @param _address Address with an existing claim.
     * @param _index Index of the asset ID to remove from the claim.
     */
    function _removeFromClaim(address _address, uint256 _index)
        internal
        virtual
        claimExists(_address)
    {
        Claim storage claim = _claims[_address];
        require(
            _index < claim.remainingAmount,
            "Claimable._removeFromClaim: Index is out of bounds."
        );

        // Save asset ID before removal
        uint256 assetId = claim.assetIds[_index];

        // reduce remaining amount first to prevent reentrancy
        claim.remainingAmount -= 1;

        // Remove asset ID from claim and asset beneficiaries
        delete claim.assetIds[_index];
        delete _assetBeneficiaries[assetId];

        // If there are no more assets in the claim, delete the claim
        if (claim.remainingAmount == 0) {
            delete _claims[_address];
            delete _beneficiaries[_address];
        }
    }
}
