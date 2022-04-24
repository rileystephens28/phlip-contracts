// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title GameRecord
 * @author Riley Stephens
 * @dev Provides contract with an interface for storing game win/loss records and
 * the overall amount of winnings. Winnings can be token addresses or ether.
 */
contract GameRecord {
    struct Record {
        uint256 wins;
        uint256 losses;
    }

    mapping(uint256 => Record) private _gameRecords;
    mapping(uint256 => bool) private _registeredRecords;

    // gameRecord ID => token address => amount won
    // Stores the amount of tokens (any token) won in games
    mapping(uint256 => mapping(address => uint256)) private _tokenWinnings;

    // Stores the amount of ETH won in games
    mapping(uint256 => uint256) private _ethWinnings;

    /**
     * @dev Accessor function for checking if a game record has been registered.
     * @param _recordID The ID of a game record to check.
     * @return True if the game record has been registered, false if not.
     */
    function gameRecordExists(uint256 _recordID)
        public
        view
        virtual
        returns (bool)
    {
        return _registeredRecords[_recordID];
    }

    /**
     * @dev Accessor function for getting a game records win count.
     * @param _recordID The ID of a game record
     * @return The number of wins on a game record.
     */
    function winsFor(uint256 _recordID) public view virtual returns (uint256) {
        return _gameRecords[_recordID].wins;
    }

    /**
     * @dev Accessor function for getting a game records loss count.
     * @param _recordID The ID of a game record
     * @return The number of losses on a game record.
     */
    function lossesFor(uint256 _recordID)
        public
        view
        virtual
        returns (uint256)
    {
        return _gameRecords[_recordID].losses;
    }

    /**
     * @dev Accessor function for getting amount of winnings for specified token.
     * @param _recordID The ID of a game record to query
     * @param _token The address of reward token to query
     * @return The total amount of specified tokens won.
     */
    function getTokenWinnings(uint256 _recordID, address _token)
        public
        view
        virtual
        returns (uint256)
    {
        require(
            _registeredRecords[_recordID],
            "GameRecord: Game record does not exist"
        );
        return _tokenWinnings[_recordID][_token];
    }

    /**
     * @dev Accessor function for getting amount of ETH won.
     * @param _recordID The ID of a game record to query
     * @return The total amount of ETH won.
     */
    function getEthWinnings(uint256 _recordID)
        public
        view
        virtual
        returns (uint256)
    {
        require(
            _registeredRecords[_recordID],
            "GameRecord: Game record does not exist"
        );
        return _ethWinnings[_recordID];
    }

    /**
     * @dev Sets the new game record ID to true in the _registeredRecords
     * mapping. The new game record ID must be unique.
     * @param _newRecordID The ID of the game record to create
     */
    function _createGameRecord(uint256 _newRecordID) internal virtual {
        require(
            !_registeredRecords[_newRecordID],
            "GameRecord: Game record already exists"
        );
        _registeredRecords[_newRecordID] = true;
    }

    /**
     * @dev Increment the number of wins by 1 for a given game record.
     * @param _recordID The ID of the game record to being updated
     */
    function _recordWin(uint256 _recordID) internal virtual {
        require(
            _registeredRecords[_recordID],
            "GameRecord: Game record does not exist"
        );
        Record storage gameRecord = _gameRecords[_recordID];
        gameRecord.wins += 1;
    }

    /**
     * @dev Increments wins by 1 and stores the amount of tokens won.
     * @param _recordID The ID of the game record to being updated
     * @param _rewardToken The address of the token rewarded for winning
     * @param _rewardAmount The amount of tokens rewarded for winning
     */
    function _recordTokenWin(
        uint256 _recordID,
        address _rewardToken,
        uint256 _rewardAmount
    ) internal virtual {
        require(
            _rewardToken != address(0),
            "GameRecord: Reward token cannot be 0x0"
        );
        require(
            _rewardAmount > 0,
            "GameRecord: Reward amount must be greater than 0 tokens"
        );
        _recordWin(_recordID);
        _tokenWinnings[_recordID][_rewardToken] += _rewardAmount;
    }

    /**
     * @dev Increments wins by 1 and stores the amount of ETH won.
     * @param _recordID The ID of the game record to being updated
     * @param _rewardAmount The amount of ETH rewarded for winning
     */
    function _recordEthWin(uint256 _recordID, uint256 _rewardAmount)
        internal
        virtual
    {
        require(
            _rewardAmount > 0,
            "GameRecord: Reward amount must be greater than 0 ETH"
        );
        _recordWin(_recordID);
        _ethWinnings[_recordID] += _rewardAmount;
    }

    /**
     * @dev Increment the number of losses by 1 for a given game record.
     * @param _recordID The ID of the game record to being updated
     */
    function _recordLoss(uint256 _recordID) internal virtual {
        require(
            _registeredRecords[_recordID],
            "GameRecord: Game record does not exist"
        );
        Record storage gameRecord = _gameRecords[_recordID];
        gameRecord.losses += 1;
    }
}
