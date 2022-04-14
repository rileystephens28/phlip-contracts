// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title Lockable
 * @author Riley Stephens
 * @dev Provides and simple interface giving a trusted address the ability
 * to lock/unlock token for transfers. Intended to be in NFT contracts to
 * allow token holders to approve other addresses as lock operators as an added layer of security
 */
abstract contract Lockable is ERC721 {
    mapping(uint256 => bool) private _isLocked;

    // Token IDs => approved to lock operator address
    mapping(uint256 => address) private _approvedOperators;

    // Token IDs => prospective lock operator address
    // Prospective lock operator must also approve before they become the lock operator
    mapping(uint256 => address) private _prospectiveOperators;

    // Token IDs => whether or not token has prospective lock operator
    mapping(uint256 => bool) private _initiatedOperatorAgreement;

    // Token IDs => whether or not approved operator has begun process of resigning
    mapping(uint256 => bool) private _initiatedOperatorResignation;

    // Token IDs => whether or not token has approved lock operator
    mapping(uint256 => bool) private _hasApprovedOperator;

    /**
     * @dev Require token is not locked and reverts if so.
     */
    modifier whenNotLocked(uint256 _tokenID) {
        require(!_isLocked[_tokenID], "Lockable: Token is locked");
        _;
    }

    /**
     * @dev Accessor to check if a token is locked
     * @param _tokenID The ID of the token to check
     * @return Whether or not the token is locked
     */
    function isLocked(uint256 _tokenID) public view returns (bool) {
        return _isLocked[_tokenID];
    }

    /**
     * @dev Accessor to check if a token has an approved lock operator
     * @param _tokenID The ID of the token to check
     * @return Whether or not token has an approved lock operator
     */
    function hasLockOperator(uint256 _tokenID) public view returns (bool) {
        return _hasApprovedOperator[_tokenID];
    }

    /**
     * @dev Set a tokens prospetive lock operator
     * @param _tokenID The ID of the token to add prospect for
     * @param _prospect The address to set as tokens prospective operator
     */
    function initiateOperatorAgreement(uint256 _tokenID, address _prospect)
        external
        virtual
    {
        _initiateOperatorAgreement(_tokenID, msg.sender, _prospect);
    }

    /**
     * @dev Set tokens prospective lock operator to approved
     * @param _tokenID The ID of the token to approve operator for
     */
    function _finalizeOperatorAgreement(uint256 _tokenID) external virtual {
        _finalizeOperatorAgreement(_tokenID, msg.sender);
    }

    /**
     * @dev Set process of resignation of approved lock operator in motion
     * @param _tokenID The ID of the token to operator is resigning for
     */
    function initiateResignation(uint256 _tokenID) internal virtual {
        _initiateResignation(_tokenID, msg.sender);
    }

    /**
     * @dev Allows owner of token to approve resgination of lock operator.
     * Token will no longer be lockable until a new lock operator is approved.
     * @param _tokenID The ID of the token to approve operator for
     */
    function finalizeResignation(uint256 _tokenID) external virtual {
        _finalizeResignation(_tokenID, msg.sender);
    }

    /**
     * @dev Set a tokens prospetive lock operator
     * @param _tokenID The ID of the token to add prospect for
     * @param _prospect The address to set as tokens prospective operator
     */
    function _initiateOperatorAgreement(
        uint256 _tokenID,
        address _owner,
        address _prospect
    ) internal virtual {
        require(
            _prospect != address(0),
            "Lockable: Prospective operator cannot be 0x0"
        );
        require(
            _prospect != _owner,
            "Lockable: Prospective operator cannot be owner"
        );
        require(
            ownerOf(_tokenID) == _owner,
            "Lockable: Must be owner to initiate operator agreement"
        );
        require(
            !_hasApprovedOperator[_tokenID],
            "Lockable: Token already has approved lock operator"
        );

        _initiatedOperatorAgreement[_tokenID] = true;
        _prospectiveOperators[_tokenID] = _prospect;
    }

    /**
     * @dev Set tokens prospective lock operator to approved
     * @param _tokenID The ID of the token to approve operator for
     * @param _operator The address of prospective operator to approve
     */
    function _finalizeOperatorAgreement(uint256 _tokenID, address _operator)
        internal
        virtual
    {
        require(
            _initiatedOperatorAgreement[_tokenID],
            "Lockable: Token does not have prospective operator"
        );
        require(
            _prospectiveOperators[_tokenID] == _operator,
            "Lockable: Caller is not prospective operator"
        );
        _hasApprovedOperator[_tokenID] = true;
        _approvedOperators[_tokenID] = _operator;

        delete _initiatedOperatorAgreement[_tokenID];
        delete _prospectiveOperators[_tokenID];
    }

    /**
     * @dev Set process of resignation of approved lock operator in motion
     * @param _tokenID The ID of the token to operator is approved for
     * @param _operator The address of approved operator trying to resign
     */
    function _initiateResignation(uint256 _tokenID, address _operator)
        internal
        virtual
    {
        require(
            _hasApprovedOperator[_tokenID],
            "Lockable: Token does not have approved operator"
        );
        require(
            _approvedOperators[_tokenID] == _operator,
            "Lockable: Caller is not prospective operator"
        );
        _initiatedOperatorResignation[_tokenID] = true;
    }

    /**
     * @dev Allows owner of token to approve resgination of lock operator.
     * Token will no longer be lockable until a new lock operator is approved.
     * @param _tokenID The ID of the token to approve operator for
     * @param _owner The address of token owner
     */
    function _finalizeResignation(uint256 _tokenID, address _owner)
        internal
        virtual
    {
        require(
            _initiatedOperatorResignation[_tokenID],
            "Lockable: Prospective operator has not initiated resignation"
        );
        require(
            ownerOf(_tokenID) == _owner,
            "Lockable: Must be owner to approve resignation"
        );

        // Ensure the token is not locked
        _isLocked[_tokenID] = false;

        // Delete approvals
        delete _hasApprovedOperator[_tokenID];
        delete _approvedOperators[_tokenID];
        delete _initiatedOperatorResignation[_tokenID];
    }
}
