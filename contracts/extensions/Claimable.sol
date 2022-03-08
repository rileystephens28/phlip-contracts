// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

/**
 * @title Claimable
 * @author Riley Stephens
 * @notice A Claim represents an asset(s) IOU that can be redeemed
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
     * @notice Require msg.sender to be a beneficiary
     * @dev Reverts if msg.sender is not
     */
    modifier onlyBeneficiary() {
        require(
            _beneficiaries[msg.sender],
            "Claimable: Address is not a beneficiary"
        );
        _;
    }

    /**
     * @notice Require address to be a beneficiary of an asset
     * @dev Reverts if address is not
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
     * @notice Require address to be a beneficiary (means claim exists)
     * @dev Reverts if address is not
     * @param _address The address to check.
     */
    modifier claimExists(address _address) {
        require(_beneficiaries[_address], "Claimable: Claim does not exist.");
        _;
    }

    /**
     * @notice Returns true if address has a claim, false if not.
     * @param _address The address to check.
     */
    function hasClaim(address _address) public view returns (bool) {
        return _beneficiaries[_address];
    }

    /**
     * @notice Returns the number of remaining claims for an account.
     * @param _address Beneficiary address of the claim.
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
     * @notice Returns the first asset ID in the claim.
     * @param _address Beneficiary address of the claim.
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
     * @notice Returns the asset ID at specified position in the claim.
     * @param _address Beneficiary address of the claim.
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
     * @notice Creates a new claim for an address.
     * @param _beneficiary Beneficiary address for new claim.
     * @param _assetIds Array of asset ids to claim.
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
     * @notice Adds an asset ID to an existing claim.
     * @param _address Beneficiary address of the claim.
     * @param _assetId Asset ID to add to the claim.
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
     * @notice Removes an asset at a specified index from
     * an existing claim. If the claim is fully redeemed after
     * the asset is removed, the claim is deleted.
     * @param _address Beneficiary address of the claim.
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
