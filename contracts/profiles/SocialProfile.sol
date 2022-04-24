// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/ISocialProfile.sol";

/**
 * @title SocialProfile
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
contract SocialProfile is ERC721, AccessControl, ISocialProfile {
    using Counters for Counters.Counter;

    string public BASE_URI;
    bytes32 public constant SETTINGS_ROLE = keccak256("SETTINGS_ROLE");

    enum FriendStatus {
        STRANGER,
        PENDING,
        APPROVED
    }

    struct Team {
        string name;
        uint256 founder;
        uint256 numMembers;
    }

    struct Profile {
        string uri;
        uint256 team;
        uint256 numFriends;
        mapping(uint256 => FriendStatus) friends;
    }

    Counters.Counter private _teamIdCounter;
    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => Team) private _teams;
    mapping(uint256 => Profile) private _profiles;

    // Profile owner address => Profile ID
    mapping(address => uint256) private _ownerProfileLookup;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri
    ) ERC721(_name, _symbol) {
        // team ID counter should start at 1 because 0 is reserved for the default no team
        _teamIdCounter.increment();
        BASE_URI = _baseUri;
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor function for getting a profiles current team.
     * @param _profileID ID of the profile to query.
     * @return ID of the profiles current team ID (0 if no team).
     */
    function teamOf(uint256 _profileID) public view returns (uint256) {
        return _profiles[_profileID].team;
    }

    /**
     * @dev Accessor function for getting a profiles number of friends.
     * @param _profileID ID of the profile to query.
     * @return Number of approved friends the profile has.
     */
    function friendCountOf(uint256 _profileID) public view returns (uint256) {
        return _profiles[_profileID].numFriends;
    }

    /**
     * @dev Accessor function for getting relation status of friends.
     * @param _baseProfile ID of the profile whose friends to check.
     * @param _queryProfile ID of the profile to check.
     * @return Integer representing the friendship status of _queryProfile in relation to _baseProfile.
     *
     * 0 = STRANGER
     * 1 = PENDING
     * 2 = APPROVED
     */
    function getFriendshipStatus(uint256 _baseProfile, uint256 _queryProfile)
        public
        view
        returns (uint256)
    {
        return uint256(_profiles[_baseProfile].friends[_queryProfile]);
    }

    /**
     * @dev Accessor method to get the details of a team.
     * @param _teamID ID of the team to query.
     * @return The profile struct data for the given profile ID.
     */
    function getTeamInfo(uint256 _teamID) public view returns (Team memory) {
        require(
            _teamID < _teamIdCounter.current(),
            "SocialProfile: Team does not exist"
        );
        return _teams[_teamID];
    }

    /**
     * @dev Accessor function for getting profiles URI from ID
     * Modified implementation of ERC721URIStorage.tokenURI
     * @param _tokenId ID of the card to get URI of
     * @return URI of the card
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "SocialProfile: Profile does not exist");

        string storage uri = _profiles[_tokenId].uri;

        // If there is no base URI, return the token URI.
        if (bytes(BASE_URI).length == 0) {
            return uri;
        }

        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(uri).length > 0) {
            return string(abi.encodePacked(BASE_URI, uri));
        }

        return super.tokenURI(_tokenId);
    }

    /**
     * @dev Override of ERC721 and AccessControl supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /***********************************|
    |     Settings Admin Functions      |
    |__________________________________*/

    /**
     * @dev Allows settings admin to set the base
     * URI for all tokens created by this contract
     * @param _newURI New base URI
     */
    function setBaseURI(string memory _newURI) public onlyRole(SETTINGS_ROLE) {
        BASE_URI = _newURI;
    }

    /***********************************|
    |     Public/External Functions     |
    |__________________________________*/

    /**
     * @dev Mint a new profile to address
     * @param _uri The IPFS CID referencing the new profile's metadata
     */
    function createProfile(string memory _uri) external {
        require(bytes(_uri).length > 0, "SocialProfile: URI is blank");
        require(
            balanceOf(msg.sender) == 0,
            "SocialProfile: Already has profile"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _ownerProfileLookup[msg.sender] = tokenId;

        // create profile
        Profile storage newProfile = _profiles[tokenId];
        newProfile.uri = _uri;

        _safeMint(msg.sender, tokenId);
    }

    /**
     * @dev Creates a new team and adds msg.sender as the founder.
     * note: Should the founder be added to the team by default?
     * @param _name Name of the team.
     */
    function createTeam(string memory _name) external {
        require(balanceOf(msg.sender) > 0, "SocialProfile: Must have profile");
        require(bytes(_name).length > 0, "SocialProfile: Name is blank");
        require(bytes(_name).length < 65, "SocialProfile: Name too long");

        uint256 teamId = _teamIdCounter.current();
        _teamIdCounter.increment();

        // Save team
        Team storage newTeam = _teams[teamId];
        newTeam.name = _name;
        newTeam.founder = _ownerProfileLookup[msg.sender];

        emit CreateTeam(teamId, newTeam.founder, newTeam.name);
    }

    /**
     * @dev Sets the team of an existing profile.
     * @param _teamID ID of the team to join
     */
    function joinTeam(uint256 _teamID) external {
        require(_teamID > 0, "SocialProfile: Invalid team ID");
        require(
            _teamID < _teamIdCounter.current(),
            "SocialProfile: Invalid team ID"
        );
        require(balanceOf(msg.sender) > 0, "SocialProfile: Must have profile");

        uint256 profileID = _ownerProfileLookup[msg.sender];
        Profile storage profile = _profiles[profileID];
        Team storage team = _teams[_teamID];

        require(profile.team != _teamID, "SocialProfile: Already on team");

        // If profile has already joined a team, remove them
        // from that team before adding them to the new team
        if (profile.team != 0) {
            _teams[profile.team].numMembers -= 1;
            emit LeaveTeam(
                profile.team,
                profileID,
                _teams[profile.team].numMembers
            );
        }

        // Set current team and add team member
        profile.team = _teamID;
        team.numMembers += 1;

        emit JoinTeam(_teamID, profileID, team.numMembers);
    }

    /**
     * @dev Sets the team of an existing profile to 0.
     */
    function leaveTeam() external {
        require(balanceOf(msg.sender) > 0, "SocialProfile: Must have profile");

        uint256 profileID = _ownerProfileLookup[msg.sender];
        Profile storage profile = _profiles[profileID];

        uint256 teamID = profile.team;
        Team storage team = _teams[profile.team];

        require(teamID != 0, "SocialProfile: Not on team");

        // Decrement team members and set current team to 0 (no team)
        team.numMembers -= 1;
        profile.team = 0;

        emit LeaveTeam(teamID, profileID, team.numMembers);
    }

    /**
     * @dev Request a friendship with another profile.
     * @param _friendID The ID of the profile being requested.
     */
    function requestFriend(uint256 _friendID) external {
        require(balanceOf(msg.sender) > 0, "SocialProfile: Must have profile");
        require(_exists(_friendID), "SocialProfile: Friend does not exist");

        uint256 requesterID = _ownerProfileLookup[msg.sender];
        Profile storage requester = _profiles[requesterID];

        require(
            requester.friends[_friendID] == FriendStatus.STRANGER,
            "SocialProfile: Already friends or requested"
        );

        requester.friends[_friendID] = FriendStatus.PENDING;

        emit SendFriendRequest(requesterID, _friendID);
    }

    /**
     * @dev Approve a friendship request from another profile.
     * @param _requesterID The ID of the profile that requested a friendship.
     */
    function approveFriend(uint256 _requesterID) external {
        require(balanceOf(msg.sender) > 0, "SocialProfile: Must have profile");

        uint256 approverID = _ownerProfileLookup[msg.sender];
        Profile storage approver = _profiles[approverID];
        Profile storage requester = _profiles[_requesterID];

        require(
            requester.friends[approverID] == FriendStatus.PENDING,
            "SocialProfile: No pending request"
        );

        // Approve friendship for both profiles
        requester.friends[approverID] = FriendStatus.APPROVED;
        approver.friends[_requesterID] = FriendStatus.APPROVED;

        // Increment friend count of both profiles
        requester.numFriends += 1;
        approver.numFriends += 1;

        emit ApproveFriendRequest(_requesterID, approverID);
    }

    /**
     * @dev Remove friendship between profiles.
     * @param _friendID The ID of the profile to remove as friend.
     */
    function removeFriend(uint256 _friendID) external {
        require(balanceOf(msg.sender) > 0, "SocialProfile: Must have profile");

        uint256 removerID = _ownerProfileLookup[msg.sender];
        Profile storage remover = _profiles[removerID];
        Profile storage removee = _profiles[_friendID];

        require(
            remover.friends[_friendID] == FriendStatus.APPROVED,
            "SocialProfile: Not friends"
        );

        // Remove friendship for both profiles
        delete remover.friends[_friendID];
        delete removee.friends[removerID];

        // Decrement friend count of both profiles
        remover.numFriends -= 1;
        removee.numFriends -= 1;

        emit RemoveFriend(removerID, _friendID);
    }

    /***********************************|
    |         Private Functions         |
    |__________________________________*/

    /**
     * @dev Function called before tokens are transferred. Override to
     * make sure that receiving address does not already have a profile.
     * @param _from The address tokens will be transferred from
     * @param _to The address tokens will be transferred  to
     * @param _tokenId The ID of the token to transfer
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal override {
        require(balanceOf(_to) == 0, "SocialProfile: Already has profile");
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }
}
