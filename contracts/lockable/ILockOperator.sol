// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title ILockOperator
 * @author Riley Stephens
 * @dev The ILockOperator interface is used to define the functions
 * required to allow an external address to lock and unlock a token.
 */
interface ILockOperator {
    /**
     * @dev Accessor to check if a token is locked
     * @param _tokenID The ID of the token to check
     * @return Whether or not the token is locked
     */
    function isLocked(uint256 _tokenID) external view returns (bool);

    /**
     * @dev Accessor to check if a token has an approved lock operator
     * Note - Lock operator is still considered approved if they have requested to resign.
     * @param _tokenID The ID of the token to check
     * @return Whether or not token has an approved lock operator
     */
    function hasLockOperator(uint256 _tokenID) external view returns (bool);

    /**
     * @dev Allows lock operator to lock token
     * @param _tokenID The ID of the token to lock
     */
    function lock(uint256 _tokenID) external;

    /**
     * @dev Allows lock operator to unlock token
     * @param _tokenID The ID of the token to lock
     */
    function unlock(uint256 _tokenID) external;

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
    ) external;

    /**
     * @dev Set tokens pending lock operator to approved
     * @param _tokenID The ID of the token to approve operator for
     */
    function finalizeOperatorAgreement(uint256 _tokenID) external;

    /**
     * @dev Set process of resignation of approved lock operator in motion
     * @param _tokenID The ID of the token to operator is resigning for
     */
    function initiateResignation(uint256 _tokenID) external;

    /**
     * @dev Allows owner of token to approve resgination of lock operator.
     * Token will no longer be lockable until a new lock operator is approved.
     * @param _tokenID The ID of the token to approve operator for
     */
    function finalizeResignation(uint256 _tokenID) external;
}
