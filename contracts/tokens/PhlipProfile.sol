// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title UserProfile
 * @author Riley Stephens
 * @notice ERC721 contract representing a Phlip user and their interactions with the game.
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

    mapping(uint256 => bool) private _registeredTeams;
    mapping(uint256 => Profile) private _profiles;
    mapping(uint256 => Team) private _teams;

    /**
     * @notice Ensure token has been minted by contract
     * @dev Reverts if token does not exist
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
     * @notice Check if an address has a profile.
     * @param _address Address to check.
     */
    function hasProfile(address _address) public view returns (bool) {
        return balanceOf(_address) > 0;
    }

    /**
     * @notice Mint a new profile to address
     * @param _uri URI of the profile.
     */
    function createProfile(string memory _uri) external {
        require(!hasProfile(msg.sender));
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
     * @notice Mint a new profile to address
     * @param _name Name of the team.
     */
    function createTeam(string memory _name) external {
        require(hasProfile(msg.sender));
        uint256 teamId = _teamIdCounter.current();
        _teamIdCounter.increment();
        _registeredTeams[teamId] = true;

        Team memory newTeam;
        newTeam.name = _name;
        newTeam.founder = msg.sender;
        _teams[teamId] = newTeam;
    }

    /**
     * @notice Allow a user to join a team.
     * @param _profileID ID of the profile joining the team.
     * @param _teamID ID of the team to join
     */
    function joinTeam(uint256 _profileID, uint256 _teamID) external {
        require(ownerOf(_profileID) == msg.sender);
        require(_registeredTeams[_teamID]);
        Profile storage profile = _profiles[_profileID];
        profile.currentTeam = _teamID;
    }

    /**
     * @notice Record token game win.
     * @param _profileID The ID of the token to record.
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
     * @notice Record token game loss.
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
