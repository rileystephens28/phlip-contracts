// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

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
contract PhlipProfile is ERC721, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    struct Team {
        string name;
        address founder;
        address[] members;
    }

    struct Profile {
        string uri;
        uint256 gamesWon;
        uint256 gamesLost;
        uint256 totalGameWinnings;
        uint256 currentTeam;
        uint256[] mintedCards;
        uint256[] friends;
    }

    Counters.Counter private _teamIdCounter;
    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => Profile) private _profiles;
    mapping(uint256 => Team) private _teams;

    mapping(address => uint256) private _profileOwners;
    mapping(uint256 => bool) private _registeredTeams;

    /**
     * @dev Requires profile has been minted by contract and reverts if not.
     * @param _profileID The profile ID to check.
     */
    modifier profileExists(uint256 _profileID) {
        require(_exists(_profileID), "PhlipProfile: Profile does not exist.");
        _;
    }

    constructor() ERC721("PhlipProfile", "USER") {
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
        profileExists(_profileID)
        returns (Profile memory)
    {
        return _profiles[_profileID];
    }

    /**
     * @dev Accessor method to get the details of a profile.
     * @param _teamID ID of the team to query.
     * @return The profile struct data for the given profile ID.
     */
    function getTeam(uint256 _teamID) public view returns (Team memory) {
        require(
            _registeredTeams[_teamID],
            "PhlipProfile: Team does not exist."
        );
        return _teams[_teamID];
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

        // register address as owner of profile
        _profileOwners[msg.sender] = tokenId;

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
        _registeredTeams[teamId] = true;

        Team memory newTeam;
        newTeam.name = _name;
        newTeam.founder = msg.sender;
        _teams[teamId] = newTeam;
    }

    /**
     * @dev Sets the currentTeam of an existing profile.
     * @param _teamID ID of the team to join
     */
    function joinTeam(uint256 _teamID) external {
        require(
            hasProfile(msg.sender),
            "PhlipProfile: Address does not have a profile."
        );
        require(
            _registeredTeams[_teamID],
            "PhlipProfile: Team does not exist."
        );
        uint256 profileID = _profileOwners[msg.sender];
        Profile storage profile = _profiles[profileID];
        profile.currentTeam = _teamID;
    }

    /**
     * @dev Appends an address to the friends array of an existing profile.
     * @param _friendID The ID of the profile being adding as a friend.
     */
    function addFriend(uint256 _friendID) external profileExists(_friendID) {
        require(
            hasProfile(msg.sender),
            "PhlipProfile: Address does not have a profile."
        );
        uint256 profileID = _profileOwners[msg.sender];
        require(
            ownerOf(profileID) == msg.sender,
            "PhlipProfile: Only owner can add friends."
        );
        Profile storage profile = _profiles[profileID];
        profile.friends.push(_friendID);
    }

    /**
     * @dev Remove an address from the friends array of an existing profile.
     * @param _friendIndex The index of the friend in the friends array.
     */
    function removeFriend(uint256 _friendIndex) external {
        // Sender must be the owner of the profile
        uint256 profileID = _profileOwners[msg.sender];
        require(
            ownerOf(profileID) == msg.sender,
            "PhlipProfile: Only owner can remove friends."
        );

        Profile storage profile = _profiles[profileID];
        require(_friendIndex < profile.friends.length);
        delete profile.friends[_friendIndex];
    }

    /**
     * @dev Incrememnts the gamesWon counter by 1 and adds the value (in ETH or DAO tokens?)
     * to an existing profile's totalGameWinnings.
     * @param _profileID The ID of the token to record.
     * @param _winnings The amount the owner of the token won from the game.
     */
    function recordWin(uint256 _profileID, uint256 _winnings)
        external
        profileExists(_profileID)
        onlyRole(RECORDER_ROLE)
    {
        Profile storage profile = _profiles[_profileID];
        profile.gamesWon += 1;
        profile.totalGameWinnings += _winnings;
    }

    /**
     * @dev Incrememnts the gamesLost counter by 1 for an existing profile.
     * @param _profileID The ID of the token to record.
     */
    function recordLoss(uint256 _profileID)
        external
        profileExists(_profileID)
        onlyRole(RECORDER_ROLE)
    {
        Profile storage profile = _profiles[_profileID];
        profile.gamesLost += 1;
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
