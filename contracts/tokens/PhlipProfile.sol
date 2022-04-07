// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../presets/AccessControlGameRecord.sol";

/**
 * @title UserProfile
 * @author Riley Stephens
 * @dev ERC721 contract representing a Phlip user and their interactions with the game.
 *
 * ## Features ##
 *
 * Connect With Friends - Adding other Players as friends allows you to play with them in private matches.
 *
 * Create & Join Teams - Any player can create a new team. Once a team is created, any other players can
 * join too. Joining a team does not provide any direct game benefits to Players. However, teams that
 * frequently win can rise through the leaderboards and gain a lot of publicity (play-to-advertise model).
 */
contract PhlipProfile is ERC721, AccessControlGameRecord {
    using Counters for Counters.Counter;

    struct Team {
        string name;
        address founder;
        uint256 numMembers;
    }

    struct Profile {
        string uri;
        uint256 gamesWon;
        uint256 gamesLost;
        uint256 currentTeam;
        uint256 numFriends;
    }

    Counters.Counter private _teamIdCounter;
    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => Profile) private _profiles;
    mapping(uint256 => uint256[]) private _cardMints;
    mapping(uint256 => uint256[]) private _friends;

    mapping(uint256 => Team) private _teams;
    mapping(uint256 => bool) private _registeredTeams;
    mapping(uint256 => uint256[]) private _teamMembers;

    /**
     * @dev Requires profile has been minted by contract and reverts if not.
     * @param _profileID The profile ID to check.
     */
    modifier profileExists(uint256 _profileID) {
        require(_exists(_profileID), "PhlipProfile: Profile does not exist.");
        _;
    }

    constructor() ERC721("PhlipProfile", "USER") AccessControlGameRecord() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, msg.sender);

        // team id counter should start at 1 becayse 0 is reserved for the default no team
        _teamIdCounter.increment();
    }

    /**
     * @dev Check if an address has a profile.
     * @param _address Address to check.
     * @return Whether or not an address has a profile
     */
    function hasProfile(address _address) public view returns (bool) {
        return balanceOf(_address) > 0;
    }

    /**
     * @dev Accessor method to get the details of a profile.
     * @param _profileID ID of the profile to query.
     * @return The profile struct data for the given profile ID.
     */
    function getProfile(uint256 _profileID)
        public
        view
        returns (Profile memory)
    {
        require(_exists(_profileID), "PhlipProfile: Profile does not exist.");
        return _profiles[_profileID];
    }

    /**
     * @dev Accessor method to get the friends of a profile.
     * @param _profileID ID of the profile to query.
     * @return An array of profile IDs (friends) of the given profile.
     */
    function getFriends(uint256 _profileID)
        public
        view
        returns (uint256[] memory)
    {
        require(_exists(_profileID), "PhlipProfile: Profile does not exist.");
        return _friends[_profileID];
    }

    /**
     * @dev Accessor method to get the details of a team.
     * @param _teamID ID of the team to query.
     * @return The profile struct data for the given profile ID.
     */
    function getTeamInfo(uint256 _teamID) public view returns (Team memory) {
        require(
            _registeredTeams[_teamID],
            "PhlipProfile: Team does not exist."
        );
        return _teams[_teamID];
    }

    /**
     * @dev Accessor method to get the array of addresses that belong to team.
     * @param _teamID ID of the team to query.
     * @return The address array of all team members
     */
    function getTeamMembers(uint256 _teamID)
        public
        view
        returns (uint256[] memory)
    {
        require(
            _registeredTeams[_teamID],
            "PhlipProfile: Team does not exist."
        );
        return _teamMembers[_teamID];
    }

    /**
     * @dev Mint a new profile to address
     * @param _uri The IPFS CID referencing the new profile's metadata
     */
    function createProfile(string memory _uri) external {
        require(bytes(_uri).length > 0, "PhlipProfile: URI cannot be blank.");
        require(
            !hasProfile(msg.sender),
            "PhlipProfile: Address already has a profile."
        );
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // create profile
        Profile memory newProfile;
        newProfile.uri = _uri;
        _profiles[tokenId] = newProfile;

        // Mint token to sender
        _safeMint(msg.sender, tokenId);
    }

    /**
     * @dev Creates a new team and adds msg.sender as the founder.
     * note: Should the founder be added to the team by default?
     * @param _name Name of the team.
     */
    function createTeam(string memory _name) external {
        require(
            bytes(_name).length > 0,
            "PhlipProfile: Team name cannot be blank."
        );
        require(
            hasProfile(msg.sender),
            "PhlipProfile: Address does not have a profile."
        );
        uint256 teamId = _teamIdCounter.current();
        _teamIdCounter.increment();

        // Register and save team
        _registeredTeams[teamId] = true;
        _teams[teamId] = Team(_name, msg.sender, 0);
    }

    /**
     * @dev Sets the currentTeam of an existing profile.
     * @param _profileID The ID of the profile joining a team.
     * @param _teamID ID of the team to join
     */
    function joinTeam(uint256 _profileID, uint256 _teamID) external {
        require(
            ownerOf(_profileID) == msg.sender,
            "PhlipProfile: Only profile owner can join teams"
        );
        require(
            _registeredTeams[_teamID],
            "PhlipProfile: Team does not exist."
        );
        Profile storage profile = _profiles[_profileID];
        require(
            profile.currentTeam != _teamID,
            "PhlipProfile: Profile has already joined this team."
        );

        // Set current team and increment team member count
        profile.currentTeam = _teamID;
        _teams[_teamID].numMembers += 1;
    }

    /**
     * @dev Appends an address to the friends array of an existing profile.
     * @param _profileID The ID of the profile to add friend to.
     * @param _friendID The ID of the profile being adding as a friend.
     */
    function addFriend(uint256 _profileID, uint256 _friendID) external {
        require(
            ownerOf(_profileID) == msg.sender,
            "PhlipProfile: Only profile owner can add friends"
        );
        require(_exists(_friendID), "PhlipProfile: Profile does not exist.");

        // Add friend ID to array and increment friend count
        _friends[_profileID].push(_friendID);
        _profiles[_profileID].numFriends += 1;
    }

    /**
     * @dev Remove an address from the friends array of an existing profile.
     * @param _profileID The ID of the profile to remove a friend from.
     * @param _friendIndex The index of the friend in the friends array.
     */
    function removeFriend(uint256 _profileID, uint256 _friendIndex) external {
        require(
            ownerOf(_profileID) == msg.sender,
            "PhlipProfile: Only profile owner can remove friends"
        );

        uint256[] memory friends = _friends[_profileID];
        require(
            _friendIndex < friends.length,
            "PhlipProfile: Friend index is out of bounds."
        );

        // Resort memory array so that the friend to remove is at the end
        for (uint256 i = _friendIndex; i < friends.length - 1; i++) {
            friends[i] = friends[i + 1];
        }

        // Set friend array to resorted memory array then pop last element
        _friends[_profileID] = friends;
        _friends[_profileID].pop();

        // Decrement friend count
        _profiles[_profileID].numFriends -= 1;
    }

    /**
     * @dev Override of ERC721 and AccessControl supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
