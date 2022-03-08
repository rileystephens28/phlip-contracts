const PhlipDAO = artifacts.require("PhlipDAO");
const PinkCard = artifacts.require("PinkCard");

contract("PinkCard", accounts => {

  const _name = "Phlip Pink Card";
  const _symbol = "PPC";
  const _baseUri = "https.ipfs.moralis.io/ipfs/";
  const _maxDownvotes = 20;
  const _maxUriChanges = 5;
  const _minDaoTokensRequired = 100;

  before(async () => {
    this.phlipDaoToken = await PhlipDAO.new("PhlipDAO", "PHLIP", 18);
  });

    beforeEach(async () => {
      this.token = await PinkCard.new(
        _baseUri,
        _maxDownvotes,
        _maxUriChanges,
        _minDaoTokensRequired,
        this.phlipDaoToken.address,
        { from: accounts[0] }
      );
    });
    
    describe("Token Attributes", () => {
      it("has the correct name", async () => {
        const name = await this.token.name();
        name.should.equal(_name);
      })

      it("has the correct symbol", async () => {
        const symbol = await this.token.symbol();
        symbol.should.equal(_symbol);
      })

      it("has the correct base URI", async () => {
        const baseUri = await this.token.BASE_URI;
        baseUri.should.equal(_baseUri);
      })

      it("has the correct max allowed downvotes", async () => {
        const maxDownvotes = await this.token.MAX_DOWNVOTES;
        maxDownvotes.should.equal(_maxDownvotes);
      })

      it("has the correct max allowed URI changes", async () => {
        const maxUriChanges = await this.token.MAX_URI_CHANGES;
        maxUriChanges.should.equal(_maxUriChanges);
      })

      it("has the correct min DAO token requirement", async () => {
        const minDaoTokensRequired = await this.token.MIN_DAO_TOKENS_REQUIRED;
        minDaoTokensRequired.should.equal(_minDaoTokensRequired);
      })

   });

   describe("Pausing Tranfers", () => {
    it("should allow PAUSER to pause transfers", async () => {
      console.log("Transfers are paused");
    })
    it("should prevent non-PAUSER from pausing transfers", async () => {
      console.log("Transfers are not paused");
    })
    it("should allow PAUSER to unpause transfers", async () => {
      console.log("Transfers are unpaused");
    })
    it("should prevent non-PAUSER from unpausing transfers", async () => {
      console.log("Transfers are not unpaused");
    })
   });

   describe("Blocking Addresses", () => {
    it("should allow BLOCKER to blacklist address", async () => {
      console.log("Address is blacklisted");
    })
    it("should prevent non-BLOCKER from blacklisting address", async () => {
      console.log("Address is not blacklisted");
    })
    it("should allow BLOCKER to unblacklist address", async () => {
      console.log("Address is unblacklisted");
    })
    it("should prevent non-BLOCKER from unblacklisting address", async () => {
      console.log("Address is not unblacklisted");
    })
   });

   describe("Setter Functions", () => {
    it("should set base URI for cards", async () => {
      console.log("Set base URI");
    })
    it("should set max number of allowed downvotes per card", async () => {
      console.log("Set downvote max");
    })
    it("should set max number of allowed URI changes per card", async () => {
      console.log("Set URI change max");
    })
    it("should set min number of DAO tokens required to vote", async () => {
      console.log("Set min DAO tokens required");
    })
  });

   describe("Claiming and Minting", () => {
    //  Minting Cards
    it("should allow MINTER to mint a new card to an address", async () => {
      console.log("Card is minted");
    })
    it("should prevent non-MINTER from minting a new card to an address", async () => {
      console.log("Card is not minted");
    })

    //  Creating Claiming
    it("should allow MINTER to create a new claim", async () => {
      console.log("Claim is created");
    })
    it("should prevent non-MINTER from creating a new claim", async () => {
      console.log("Claim is not created");
    })

    // Increasing Claims
    it("should allow MINTER to increase claimable amount of existing claim", async () => {
      console.log("Claimable amount is increased");
    })
    it("should prevent non-MINTER from increasing claimable amount of existing claim", async () => {
      console.log("Claimable amount is not increased");
    })

    // Redeeming Claims
    it("should allow address with claim to redeem card", async () => {
      console.log("Address redeems card.");
    })
    it("should prevent address without claim from redeeming card", async () => {
      console.log("Address does not claim card.");
    })
    
   });

  

});