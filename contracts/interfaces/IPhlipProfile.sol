// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title UserProfile
 * @author Riley Stephens
 * @dev Functions required to manage a Phlip user and their interactions with the game.
 */
interface IPhlipProfile {
    event CreateTeam(
        uint256 indexed _team,
        uint256 indexed _founder,
        string _name
    );
    event JoinTeam(
        uint256 indexed _team,
        uint256 indexed _profile,
        uint256 _numMembers
    );
    event LeaveTeam(
        uint256 indexed _team,
        uint256 indexed _profile,
        uint256 _numMembers
    );

    event SendFriendRequest(
        uint256 indexed _requester,
        uint256 indexed _requested
    );
    event ApproveFriendRequest(
        uint256 indexed _requester,
        uint256 indexed _approver
    );
    event RemoveFriend(uint256 indexed _profile, uint256 indexed _friend);

    /**
     * @dev Accessor function for getting a profiles current team.
     * @param _profileID ID of the profile to query.
     * @return ID of the profiles current team ID (0 if no team).
     */
    function teamOf(uint256 _profileID) external view returns (uint256);

    /**
     * @dev Accessor function for getting a profiles number of friends.
     * @param _profileID ID of the profile to query.
     * @return Number of approved friends the profile has.
     */
    function friendCountOf(uint256 _profileID) external view returns (uint256);

    /**
     * @dev Mint a new profile to address
     * @param _uri The IPFS CID referencing the new profile's metadata
     */
    function createProfile(string memory _uri) external;

    /**
     * @dev Creates a new team and sets caller as the founder.
     * @param _name Name of the team.
     */
    function createTeam(string memory _name) external;

    /**
     * @dev Sets the currentTeam of an existing profile.
     * @param _teamID ID of the team to join
     */
    function joinTeam(uint256 _teamID) external;

    /**
     * @dev Sets the team of an existing profile to 0.
     */
    function leaveTeam() external;

    /**
     * @dev Request a friendship with another profile.
     * @param _friendID The ID of the profile being requested.
     */
    function requestFriend(uint256 _friendID) external;

    /**
     * @dev Approve a friendship request from another profile.
     * @param _requesterID The ID of the profile that requested a friendship.
     */
    function approveFriend(uint256 _requesterID) external;

    /**
     * @dev Remove friendship between profiles.
     * @param _friendID The ID of the profile to remove as friend.
     */
    function removeFriend(uint256 _friendID) external;
}
