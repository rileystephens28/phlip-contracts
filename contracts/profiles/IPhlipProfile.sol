// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title UserProfile
 * @author Riley Stephens
 * @dev Functions required to manage a Phlip user and their interactions with the game.
 */
interface IPhlipProfile {
    /**
     * @dev Check if an address has a profile.
     * @param _address Address to check.
     * @return Whether or not an address has a profile
     */
    function hasProfile(address _address) external view returns (bool);

    /**
     * @dev Accessor method for array of friend addresses of a profile.
     * @param _profileID ID of the profile to query.
     * @return An array of profile IDs (friends) of the given profile.
     */
    function getFriends(uint256 _profileID)
        external
        view
        returns (uint256[] memory);

    /**
     * @dev Accessor method for array of addresses that are members of team.
     * @param _teamID ID of the team to query.
     * @return The address array of all team members
     */
    function getTeamMembers(uint256 _teamID)
        external
        view
        returns (uint256[] memory);

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
     * @param _profileID The ID of the profile joining a team.
     * @param _teamID ID of the team to join
     */
    function joinTeam(uint256 _profileID, uint256 _teamID) external;

    /**
     * @dev Appends an address to the friends array of an existing profile.
     * @param _profileID The ID of the profile to add friend to.
     * @param _friendID The ID of the profile being adding as a friend.
     */
    function addFriend(uint256 _profileID, uint256 _friendID) external;

    /**
     * @dev Remove an address from the friends array of an existing profile.
     * @param _profileID The ID of the profile to remove a friend from.
     * @param _friendIndex The index of the friend in the friends array.
     */
    function removeFriend(uint256 _profileID, uint256 _friendIndex) external;
}
