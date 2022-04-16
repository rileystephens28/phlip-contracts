// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title ERC721Lockable
 * @author Riley Stephens
 * @dev Provides and simple interface giving a trusted address the ability
 * to lock/unlock token for transfers. Intended to be in NFT contracts to
 * allow token holders to approve other addresses as lock operators as an added layer of security
 */
abstract contract ERC721Lockable is ERC721 {
    // Mapping of whether a lock operator has locked a token
    mapping(uint256 => bool) private _lockedByOperator;

    // OperatorStatus allows external addresses to go through the process
    // of agreeing to their position as a lock operator for a specific token.
    // (0) UNSET - The operator status has not been set
    // (1) APPROVAL_PENDING - The token owner has specified an operator address and now awaits approval from the operator
    // (2) APPROVED - The operator has approved the request and can now lock/unlock the token
    // (3) RESIGNATION_PENDING - The operator has requested to resign and now awaits approval from the token owner
    enum OperatorStatus {
        UNSET,
        APPROVAL_PENDING,
        APPROVED,
        RESIGNATION_PENDING
    }

    // OperatorAgreement combines the operator address and the status of the operator
    struct OperatorAgreement {
        address operator;
        OperatorStatus status;
        uint256 expiration;
    }

    mapping(uint256 => OperatorAgreement) private _operatorAgreements;

    /**
     * @dev Require token is not locked and reverts if so.
     */
    modifier whenNotLocked(uint256 _tokenID) {
        require(!_isLocked(_tokenID), "ERC721Lockable: Token is locked");
        _;
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor to check if a token is locked
     * @param _tokenID The ID of the token to check
     * @return Whether or not the token is locked
     */
    function isLocked(uint256 _tokenID) public view returns (bool) {
        return _isLocked(_tokenID);
    }

    /**
     * @dev Accessor to check if a token has an approved lock operator
     * Note - Lock operator is still considered approved if they have requested to resign.
     * @param _tokenID The ID of the token to check
     * @return Whether or not token has an approved lock operator
     */
    function hasLockOperator(uint256 _tokenID) public view returns (bool) {
        return _hasValidOperator(_tokenID);
    }

    /**
     * @dev Accessor to get agreement operator address
     * @param _tokenID The ID of the token to check
     * @return Address of tokens lock operator
     */
    function lockOperatorOf(uint256 _tokenID) public view returns (address) {
        if (_agreementHasExpired(_tokenID)) {
            return address(0);
        }
        return _operatorAgreements[_tokenID].operator;
    }

    /**
     * @dev Accessor to get agreement status
     * @param _tokenID The ID of the token to check
     * @return Uint representing the status of the agreement:
     *  0 -> UNSET
     *  1 -> APPROVAL_PENDING
     *  2 -> APPROVED
     *  3 -> RESIGNATION_PENDING
     */
    function agreementStatusOf(uint256 _tokenID) public view returns (uint256) {
        if (_agreementHasExpired(_tokenID)) {
            return 0;
        }
        return uint256(_operatorAgreements[_tokenID].status);
    }

    /***********************************|
    |        External Functions         |
    |__________________________________*/

    /**
     * @dev Allows approved operator to lock transfers of specified token
     * @param _tokenID The ID of the token to lock
     */
    function lock(uint256 _tokenID) external virtual {
        require(
            !_isLocked(_tokenID),
            "ERC721Lockable: Token is already locked"
        );
        _setLock(_tokenID, true);
    }

    /**
     * @dev Allows approved operator to unlock transfers of specified token
     * @param _tokenID The ID of the token to lock
     */
    function unlock(uint256 _tokenID) external virtual {
        require(
            _isLocked(_tokenID),
            "ERC721Lockable: Token is already unlocked"
        );
        _setLock(_tokenID, false);
    }

    /**
     * @dev Set a tokens prospetive lock operator
     * @param _tokenID The ID of the token to add prospect for
     * @param _prospect The address to set as tokens pending operator
     * @param _expiration The time at which the operator agreement expires (0 = no expiration)
     */
    function initiateOperatorAgreement(
        uint256 _tokenID,
        address _prospect,
        uint256 _expiration
    ) external virtual {
        _initiateOperatorAgreement(
            _tokenID,
            msg.sender,
            _prospect,
            _expiration
        );
    }

    /**
     * @dev Set tokens pending lock operator to approved
     * @param _tokenID The ID of the token to approve operator for
     */
    function finalizeOperatorAgreement(uint256 _tokenID) external virtual {
        _finalizeOperatorAgreement(_tokenID, msg.sender);
    }

    /**
     * @dev Set process of resignation of approved lock operator in motion
     * @param _tokenID The ID of the token to operator is resigning for
     */
    function initiateResignation(uint256 _tokenID) external virtual {
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

    /***********************************|
    |        Internal Functions         |
    |__________________________________*/

    /**
     * @dev Check if token was locked by operator or not. If token was locked by
     * operator and the operator agreement has expired, then the token is unlocked.
     * @param _tokenID The ID of the token to check
     */
    function _isLocked(uint256 _tokenID) internal view virtual returns (bool) {
        return !_agreementHasExpired(_tokenID) && _lockedByOperator[_tokenID];
    }

    /**
     * @dev Accessor to check if a token has an approved lock operator
     * Valid lock operator conditions:
     * - Operator agreement status = APPROVED or RESIGNATION_PENDING
     *   AND
     * - Operator agreement has no expiration or it has not expired yet
     * @param _tokenID The ID of the token to check
     * @return Whether or not token has an approved lock operator
     */
    function _hasValidOperator(uint256 _tokenID) internal view returns (bool) {
        OperatorAgreement storage agreement = _operatorAgreements[_tokenID];
        return
            !_agreementHasExpired(_tokenID) &&
            (agreement.status == OperatorStatus.APPROVED ||
                agreement.status == OperatorStatus.RESIGNATION_PENDING);
    }

    /**
     * @dev Accessor to check if lock operator agreement has expired
     * @param _tokenID The ID of the token to check
     * @return Whether or not lock operator agreement has expired
     */
    function _agreementHasExpired(uint256 _tokenID)
        internal
        view
        returns (bool)
    {
        OperatorAgreement storage agreement = _operatorAgreements[_tokenID];
        return
            agreement.expiration != 0 && agreement.expiration < block.timestamp;
    }

    /**
     * @dev Check if token was locked by operator or not. If token was locked by
     * operator and the operator agreement has expired, then the token is unlocked.
     * @param _tokenID The ID of the token to check
     */
    function _setLock(uint256 _tokenID, bool _lockVal) internal virtual {
        require(_exists(_tokenID), "ERC721Lockable: Token does not exist");
        require(
            _hasValidOperator(_tokenID),
            "ERC721Lockable: No approved operator"
        );
        require(
            _operatorAgreements[_tokenID].operator == msg.sender,
            "ERC721Lockable: Not approved operator"
        );
        _lockedByOperator[_tokenID] = _lockVal;
    }

    /**
     * @dev Set a tokens prospetive lock operator
     * @param _tokenID The ID of the token to add prospect for
     * @param _prospect The address to set as tokens pending operator
     * @param _expiration The time at which the operator agreement expires (0 = no expiration)
     */
    function _initiateOperatorAgreement(
        uint256 _tokenID,
        address _owner,
        address _prospect,
        uint256 _expiration
    ) internal virtual {
        require(_exists(_tokenID), "ERC721Lockable: Token does not exist");
        require(
            !_hasValidOperator(_tokenID),
            "ERC721Lockable: Token has existing operator agreement"
        );
        require(
            _prospect != address(0),
            "ERC721Lockable: Pending operator cannot be 0x0"
        );
        require(
            _prospect != _owner,
            "ERC721Lockable: Pending operator cannot be owner"
        );
        require(
            _expiration == 0 || _expiration > block.timestamp,
            "ERC721Lockable: Invalid expiration"
        );
        require(
            ownerOf(_tokenID) == _owner,
            "ERC721Lockable: Owner must initiate operator agreement"
        );
        OperatorAgreement storage agreement = _operatorAgreements[_tokenID];
        agreement.operator = _prospect;
        agreement.status = OperatorStatus.APPROVAL_PENDING;
        agreement.expiration = _expiration;
    }

    /**
     * @dev Set tokens pending lock operator to approved
     * @param _tokenID The ID of the token to approve operator for
     * @param _operator The address of pending operator to approve
     */
    function _finalizeOperatorAgreement(uint256 _tokenID, address _operator)
        internal
        virtual
    {
        OperatorAgreement storage agreement = _operatorAgreements[_tokenID];
        require(
            agreement.status == OperatorStatus.APPROVAL_PENDING,
            "ERC721Lockable: No pending operator agreement"
        );
        require(
            agreement.operator == _operator,
            "ERC721Lockable: Not pending operator"
        );
        agreement.status = OperatorStatus.APPROVED;
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
        OperatorAgreement storage agreement = _operatorAgreements[_tokenID];
        require(
            agreement.status == OperatorStatus.APPROVED,
            "ERC721Lockable: No approved operator"
        );
        require(
            agreement.operator == _operator,
            "ERC721Lockable: Not approved operator"
        );
        agreement.status = OperatorStatus.RESIGNATION_PENDING;
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
            ownerOf(_tokenID) == _owner,
            "ERC721Lockable: Owner must approve resignation"
        );
        OperatorAgreement storage agreement = _operatorAgreements[_tokenID];
        require(
            agreement.status == OperatorStatus.RESIGNATION_PENDING,
            "ERC721Lockable: Operator has not initiated resignation"
        );

        // Ensure the token is not locked
        _lockedByOperator[_tokenID] = false;

        // Delete operator agreement
        delete _operatorAgreements[_tokenID];
    }

    /**
     * @dev Function called before tokens are transferred. Override to
     * make sure that token tranfer have not been locked.
     * @param _from The address tokens will be transferred from
     * @param _to The address tokens will be transferred  to
     * @param _tokenId The ID of the token to transfer
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal virtual override whenNotLocked(_tokenId) {
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }
}
