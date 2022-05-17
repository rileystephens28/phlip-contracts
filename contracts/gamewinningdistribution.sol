    // ///dev sets ecosystem fee wallets/addresses
    // function updateCreatorTipFeeWallet (address _CreatorTipFeeWallet) onlyDaoControl external {
    //       CreatorTipFeeWallet = _CreatorTipFeeWallet
    // } 
       
    // function updateFarmingRewardsFeeWallet (address _FarmingRewardsFeeWallet) onlyDaoControl external {
    //         FarmingRewardsFeeWallet = _FarmingRewardsFeeWallet
    // }   
       
    // function updateDaoProductMarketingFundFeeWallet (address _DaoProductMarketingFundFeeWallet) onlyDaoControl external {
    //         DaoProductMarketingFundFeeWallet = _DaoProductMarketingFundFeeWallet
    // }     

    // ///dev sets gameplay fees
    // function SetGamePlayFeePercent(uint256 _CreatorTipFee, uint256 _FarmingRewardsFee, uint256 _DaoProductMarketingFundFee, uint256 _PinkCardMinterFee, uint256 _PinkCardOwnerFee, uint256 _WhiteCardMinterFee, uint256 _WhiteCardOwnerFee) onlyDaoControl external {
    //     CreatorTipFee = _CreatorTipFee;
    //     FarmingRewardsFee = _FarmingRewardsFee;
    //     DaoProductMarketingFundFee = _DaoProductMarketingFundFee;
    //     PinkCardMinterFee = _PinkCardMinterFee;
    //     PinkCardOwnerFee = _PinkCardOwnerFee;
    //     WhiteCardMinterFee = _WhiteCardMinterFee;
    //     WhiteCardOwnerFee = _WhiteCardOwnerFee;
    // }

    // ///Dev sets dao control wallet
    // modifier onlyDaocontrol {
    //     require(msg.sender == DAOcontrol, "only the dao can execute this function");
    //   _;
    // }    
        
    // //Dev determines token allocation for each beneficiary

    //     uint256 totalfee = CreatorTipFee.add(FarmingRewardsFee).add(DaoProductMarketingFundFee).add(PinkCardMinterFee).add(PinkCardOwnerFee).add(WhiteCardMinterFee).add(WhiteCardOwnerFee);
        
    //     uint256 amount = WinningBalance;
        
    //     uint256 CreatorTip = amount.mul(CreatorTipFee).div(totalfee));
    //     uint256 Farmingrewards = amount.mul(FarmingRewardsFee).div(totalfee));
    //     uint256 DaoProductMarketingFund = amount.mul(DaoProductMarketingFundFee)).div(totalfee));
    //     uint256 PinkCardMinter = amount.mul(PinkCardMinterFee).div(totalfee));
    //     uint256 PinkCardOwner = amount.mul(PinkCardOwnerFee).div(totalfee));
    //     uint256 WhiteCardMinter = amount.mul(WhiteCardMinterFee).div(totalfee));
    //     uint256 WhiteCardOwner = amount.mul(WhiteCardOwnerFee).div(totalfee));
    //     uint256 Winningplayer = amount.sub(totalfee);
