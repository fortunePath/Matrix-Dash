
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

describe("PathFortune Tournament Platform Tests", () => {
  beforeEach(() => {
    simnet.mineEmptyBlock();
  });

  describe("Contract initialization", () => {
    it("should have correct tournament constants", () => {
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-tournament-constants", [], deployer);
      expect(result).toBeTuple({
        "min-entry-price": 1000000, // 1 STX
        "min-pool-contribution": 5000000, // 5 STX
        "min-target-pool": 10000000, // 10 STX
        "min-duration": 144,
        "max-duration": 1008,
        "winners-percentage": 80,
        "treasury-percentage": 10,
        "burn-percentage": 10
      });
    });

    it("should show empty contract stats initially", () => {
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-contract-stats", [], deployer);
      expect(result).toBeTuple({
        "next-tournament-id": 1,
        "treasury-balance": 0,
        "total-burned": 0,
        "contract-balance": 0
      });
    });
  });

  describe("Tournament creation", () => {
    it("should allow creating a tournament with valid parameters", () => {
      const minEntryPrice = 2000000; // 2 STX
      const poolContribution = 10000000; // 10 STX
      const targetPool = 50000000; // 50 STX
      const duration = 300; // blocks
      
      const { result } = simnet.callPublicFn("pathfortune", "create-tournament", [
        Cl.uint(minEntryPrice),
        Cl.uint(poolContribution),
        Cl.uint(targetPool),
        Cl.uint(duration)
      ], wallet1);
      
      expect(result).toBeOk(Cl.uint(1)); // First tournament ID should be 1
    });

    it("should reject tournaments with insufficient entry price", () => {
      const minEntryPrice = 500000; // 0.5 STX (below minimum)
      const poolContribution = 10000000; // 10 STX
      const targetPool = 50000000; // 50 STX
      const duration = 300;
      
      const { result } = simnet.callPublicFn("pathfortune", "create-tournament", [
        `u${minEntryPrice}`,
        `u${poolContribution}`,
        `u${targetPool}`,
        `u${duration}`
      ], wallet1);
      
      expect(result).toBeErr(100); // ERR-INSUFFICIENT-ENTRY-AMOUNT
    });

    it("should reject tournaments with insufficient pool contribution", () => {
      const minEntryPrice = 2000000; // 2 STX
      const poolContribution = 3000000; // 3 STX (below minimum)
      const targetPool = 50000000; // 50 STX
      const duration = 300;
      
      const { result } = simnet.callPublicFn("pathfortune", "create-tournament", [
        `u${minEntryPrice}`,
        `u${poolContribution}`,
        `u${targetPool}`,
        `u${duration}`
      ], wallet1);
      
      expect(result).toBeErr(101); // ERR-INSUFFICIENT-POOL-CONTRIBUTION
    });

    it("should reject tournaments with invalid target pool", () => {
      const minEntryPrice = 2000000; // 2 STX
      const poolContribution = 10000000; // 10 STX
      const targetPool = 5000000; // 5 STX (below minimum)
      const duration = 300;
      
      const { result } = simnet.callPublicFn("pathfortune", "create-tournament", [
        `u${minEntryPrice}`,
        `u${poolContribution}`,
        `u${targetPool}`,
        `u${duration}`
      ], wallet1);
      
      expect(result).toBeErr(104); // ERR-INVALID-TARGET-POOL
    });

    it("should transfer pool contribution from creator to contract", () => {
      const poolContribution = 10000000; // 10 STX
      const initialBalance = simnet.getAssetsMap().get(wallet1)?.STX || 0;
      
      simnet.callPublicFn("pathfortune", "create-tournament", [
        "u2000000", // 2 STX min entry
        `u${poolContribution}`,
        "u50000000", // 50 STX target
        "u300"
      ], wallet1);
      
      const finalBalance = simnet.getAssetsMap().get(wallet1)?.STX || 0;
      expect(finalBalance).toBe(initialBalance - poolContribution);
    });

    it("should create tournament record", () => {
      const minEntryPrice = 2000000;
      const poolContribution = 10000000;
      const targetPool = 50000000;
      const duration = 300;
      
      simnet.callPublicFn("pathfortune", "create-tournament", [
        `u${minEntryPrice}`,
        `u${poolContribution}`,
        `u${targetPool}`,
        `u${duration}`
      ], wallet1);
      
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-tournament", [
        "u1"
      ], wallet1);
      
      expect(result).toBeSome({
        "creator": wallet1,
        "min-entry-price": minEntryPrice,
        "pool-contribution": poolContribution,
        "target-pool": targetPool,
        "duration": duration,
        "start-block": null,
        "end-block": null,
        "current-pool": poolContribution,
        "participant-count": 0,
        "status": "pending",
        "created-at": simnet.blockHeight
      });
    });
  });

  describe("Tournament entry", () => {
    beforeEach(() => {
      // Create a tournament before each test
      simnet.callPublicFn("pathfortune", "create-tournament", [
        "u2000000", // 2 STX min entry
        "u10000000", // 10 STX pool contribution
        "u30000000", // 30 STX target pool
        "u300" // duration
      ], wallet1);
    });

    it("should allow entering tournament with minimum entry price", () => {
      const entryAmount = 2000000; // 2 STX (exactly minimum)
      
      const { result } = simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1", // tournament ID
        `u${entryAmount}`
      ], wallet2);
      
      expect(result).toBeOk(true);
    });

    it("should allow entering tournament with amount above minimum", () => {
      const entryAmount = 5000000; // 5 STX (above minimum)
      
      const { result } = simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        `u${entryAmount}`
      ], wallet2);
      
      expect(result).toBeOk(true);
    });

    it("should reject entry below minimum price", () => {
      const entryAmount = 1500000; // 1.5 STX (below minimum)
      
      const { result } = simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        `u${entryAmount}`
      ], wallet2);
      
      expect(result).toBeErr(100); // ERR-INSUFFICIENT-ENTRY-AMOUNT
    });

    it("should prevent double entry from same player", () => {
      const entryAmount = 3000000; // 3 STX
      
      // First entry
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        `u${entryAmount}`
      ], wallet2);
      
      // Second entry attempt
      const { result } = simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        `u${entryAmount}`
      ], wallet2);
      
      expect(result).toBeErr(105); // ERR-ALREADY-PARTICIPATED
    });

    it("should update tournament pool and participant count", () => {
      const entryAmount = 5000000; // 5 STX
      
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        `u${entryAmount}`
      ], wallet2);
      
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-tournament", [
        "u1"
      ], deployer);
      
      expect(result).toBeSome({
        "creator": wallet1,
        "min-entry-price": 2000000,
        "pool-contribution": 10000000,
        "target-pool": 30000000,
        "duration": 300,
        "start-block": null,
        "end-block": null,
        "current-pool": 15000000, // 10M + 5M
        "participant-count": 1,
        "status": "pending",
        "created-at": simnet.blockHeight - 1
      });
    });

    it("should create participant record", () => {
      const entryAmount = 4000000; // 4 STX
      
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        `u${entryAmount}`
      ], wallet2);
      
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-participant", [
        "u1",
        wallet2
      ], deployer);
      
      expect(result).toBeSome({
        "entry-amount": entryAmount,
        "entry-block": simnet.blockHeight,
        "best-score": 0,
        "games-played": 0,
        "final-rank": null
      });
    });
  });

  describe("Tournament auto-start", () => {
    beforeEach(() => {
      // Create a tournament with 20 STX target pool
      simnet.callPublicFn("pathfortune", "create-tournament", [
        "u2000000", // 2 STX min entry
        "u10000000", // 10 STX pool contribution (creator)
        "u20000000", // 20 STX target pool
        "u300" // duration
      ], wallet1);
    });

    it("should auto-start tournament when target pool is reached", () => {
      // Current pool: 10 STX (creator contribution)
      // Need 10 STX more to reach target
      
      // Add 10 STX to reach exactly 20 STX target
      const { result } = simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u10000000" // 10 STX
      ], wallet2);
      
      expect(result).toBeOk(true);
      
      // Check tournament is now active
      const tournamentResult = simnet.callReadOnlyFn("pathfortune", "get-tournament", [
        "u1"
      ], deployer);
      
      expect(tournamentResult.result).toBeSome({
        "creator": wallet1,
        "min-entry-price": 2000000,
        "pool-contribution": 10000000,
        "target-pool": 20000000,
        "duration": 300,
        "start-block": simnet.blockHeight,
        "end-block": simnet.blockHeight + 300,
        "current-pool": 20000000,
        "participant-count": 1,
        "status": "active",
        "created-at": simnet.blockHeight - 1
      });
    });

    it("should remain pending if target pool not reached", () => {
      // Add only 5 STX (total will be 15 STX, below 20 STX target)
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u5000000" // 5 STX
      ], wallet2);
      
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-tournament", [
        "u1"
      ], deployer);
      
      expect(result).toBeSome({
        "creator": wallet1,
        "min-entry-price": 2000000,
        "pool-contribution": 10000000,
        "target-pool": 20000000,
        "duration": 300,
        "start-block": null,
        "end-block": null,
        "current-pool": 15000000, // 10M + 5M
        "participant-count": 1,
        "status": "pending",
        "created-at": simnet.blockHeight - 1
      });
    });

    it("should allow multiple players to contribute until target reached", () => {
      // Player 2: 3 STX (total: 13 STX)
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u3000000"
      ], wallet2);
      
      // Player 3: 4 STX (total: 17 STX)
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u4000000"
      ], wallet3);
      
      // Player 4: 3 STX (total: 20 STX - reaches target!)
      const { result } = simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u3000000"
      ], wallet4);
      
      expect(result).toBeOk(true);
      
      // Check tournament is active with 3 participants
      const tournamentResult = simnet.callReadOnlyFn("pathfortune", "get-tournament", [
        "u1"
      ], deployer);
      
      expect(tournamentResult.result).toBeSome({
        "creator": wallet1,
        "min-entry-price": 2000000,
        "pool-contribution": 10000000,
        "target-pool": 20000000,
        "duration": 300,
        "start-block": simnet.blockHeight,
        "end-block": simnet.blockHeight + 300,
        "current-pool": 20000000,
        "participant-count": 3,
        "status": "active",
        "created-at": simnet.blockHeight - 3
      });
    });

    it("should reject entry that would exceed target pool", () => {
      // Current pool: 10 STX, target: 20 STX
      // Try to add 15 STX (would make total 25 STX, exceeding target)
      const { result } = simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u15000000" // 15 STX
      ], wallet2);
      
      expect(result).toBeErr(112); // ERR-POOL-TARGET-REACHED
    });
  });

  describe("Score submission", () => {
    beforeEach(() => {
      // Create and start a tournament
      simnet.callPublicFn("pathfortune", "create-tournament", [
        "u2000000", // 2 STX min entry
        "u10000000", // 10 STX pool contribution
        "u20000000", // 20 STX target pool
        "u300" // duration
      ], wallet1);
      
      // Enter tournament to start it
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u10000000" // 10 STX (reaches target, starts tournament)
      ], wallet2);
    });

    it("should allow submitting scores during active tournament", () => {
      const score = 15000; // Game score
      
      const { result } = simnet.callPublicFn("pathfortune", "submit-score", [
        "u1", // tournament ID
        `u${score}`
      ], wallet2);
      
      expect(result).toBeOk(true);
    });

    it("should update participant's best score and games played", () => {
      const score1 = 10000;
      const score2 = 15000; // Higher score
      const score3 = 12000; // Lower than best
      
      // Submit multiple scores
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", `u${score1}`], wallet2);
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", `u${score2}`], wallet2);
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", `u${score3}`], wallet2);
      
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-participant", [
        "u1",
        wallet2
      ], deployer);
      
      expect(result).toBeSome({
        "entry-amount": 10000000,
        "entry-block": simnet.blockHeight - 3,
        "best-score": score2, // Should be the highest score
        "games-played": 3,
        "final-rank": null
      });
    });

    it("should record individual game scores", () => {
      const score = 12500;
      
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", `u${score}`], wallet2);
      
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-game-score", [
        "u1", // tournament ID
        wallet2, // player
        "u1" // game number
      ], deployer);
      
      expect(result).toBeSome({
        "score": score,
        "submitted-at": simnet.blockHeight
      });
    });

    it("should update player's global best score", () => {
      const score = 20000;
      
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", `u${score}`], wallet2);
      
      const { result } = simnet.callReadOnlyFn("pathfortune", "get-player-stats", [
        wallet2
      ], deployer);
      
      expect(result).toBeSome({
        "tournaments-played": 1,
        "total-entry-fees": 10000000,
        "total-winnings": 0,
        "tournaments-won": 0,
        "best-score": score
      });
    });

    it("should reject scores from non-participants", () => {
      const { result } = simnet.callPublicFn("pathfortune", "submit-score", [
        "u1",
        "u15000"
      ], wallet3); // wallet3 didn't enter the tournament
      
      expect(result).toBeErr(108); // ERR-UNAUTHORIZED
    });

    it("should reject zero or negative scores", () => {
      const { result } = simnet.callPublicFn("pathfortune", "submit-score", [
        "u1",
        "u0" // Invalid score
      ], wallet2);
      
      expect(result).toBeErr(111); // ERR-INVALID-SCORE
    });
  });

  describe("Tournament ending", () => {
    beforeEach(() => {
      // Create and start a short tournament (5 blocks)
      simnet.callPublicFn("pathfortune", "create-tournament", [
        "u2000000", // 2 STX min entry
        "u10000000", // 10 STX pool contribution
        "u20000000", // 20 STX target pool
        "u5" // 5 block duration
      ], wallet1);
      
      // Enter tournament to start it
      simnet.callPublicFn("pathfortune", "enter-tournament", [
        "u1",
        "u10000000" // 10 STX (reaches target, starts tournament)
      ], wallet2);
    });

    it("should allow ending tournament after duration expires", () => {
      // Mine blocks to exceed tournament duration
      for (let i = 0; i < 6; i++) {
        simnet.mineEmptyBlock();
      }
      
      const { result } = simnet.callPublicFn("pathfortune", "end-tournament", [
        "u1"
      ], deployer);
      
      expect(result).toBeOk(true);
      
      // Check tournament status changed to "ended"
      const tournamentResult = simnet.callReadOnlyFn("pathfortune", "get-tournament", [
        "u1"
      ], deployer);
      
      expect(tournamentResult.result).toBeSome({
        "creator": wallet1,
        "min-entry-price": 2000000,
        "pool-contribution": 10000000,
        "target-pool": 20000000,
        "duration": 5,
        "start-block": simnet.blockHeight - 6,
        "end-block": simnet.blockHeight - 1,
        "current-pool": 20000000,
        "participant-count": 1,
        "status": "ended",
        "created-at": simnet.blockHeight - 7
      });
    });

    it("should reject ending tournament before duration expires", () => {
      // Try to end immediately (duration not expired)
      const { result } = simnet.callPublicFn("pathfortune", "end-tournament", [
        "u1"
      ], deployer);
      
      expect(result).toBeErr(109); // ERR-TOURNAMENT-NOT-ENDED
    });
  });

  describe("Prize distribution", () => {
    beforeEach(() => {
      // Create tournament with multiple participants
      simnet.callPublicFn("pathfortune", "create-tournament", [
        "u2000000", // 2 STX min entry
        "u10000000", // 10 STX pool contribution
        "u30000000", // 30 STX target pool
        "u5" // 5 block duration
      ], wallet1);
      
      // Multiple players enter
      simnet.callPublicFn("pathfortune", "enter-tournament", ["u1", "u8000000"], wallet2); // 8 STX
      simnet.callPublicFn("pathfortune", "enter-tournament", ["u1", "u7000000"], wallet3); // 7 STX  
      simnet.callPublicFn("pathfortune", "enter-tournament", ["u1", "u5000000"], wallet4); // 5 STX (total: 30 STX)
      
      // Submit some scores
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", "u15000"], wallet2);
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", "u12000"], wallet3);
      simnet.callPublicFn("pathfortune", "submit-score", ["u1", "u8000"], wallet4);
      
      // End tournament
      for (let i = 0; i < 6; i++) {
        simnet.mineEmptyBlock();
      }
      simnet.callPublicFn("pathfortune", "end-tournament", ["u1"], deployer);
    });

    it("should distribute prizes correctly (80/10/10 split)", () => {
      const winners = [wallet2]; // Top 10% winner
      const totalPool = 30000000; // 30 STX
      const expectedWinnersPrize = Math.floor((totalPool * 80) / 100); // 24 STX
      const expectedTreasury = Math.floor((totalPool * 10) / 100); // 3 STX
      const expectedBurn = Math.floor((totalPool * 10) / 100); // 3 STX
      
      const initialBalance = simnet.getAssetsMap().get(wallet2)?.STX || 0;
      
      const { result } = simnet.callPublicFn("pathfortune", "distribute-prizes", [
        "u1",
        `[${wallet2}]` // Winner list
      ], deployer);
      
      expect(result).toBeOk(true);
      
      // Check winner received prize
      const finalBalance = simnet.getAssetsMap().get(wallet2)?.STX || 0;
      expect(finalBalance).toBe(initialBalance + expectedWinnersPrize);
      
      // Check contract stats updated
      const statsResult = simnet.callReadOnlyFn("pathfortune", "get-contract-stats", [], deployer);
      expect(statsResult.result).toBeOk({
        "next-tournament-id": 2,
        "treasury-balance": expectedTreasury,
        "total-burned": expectedBurn,
        "contract-balance": expectedTreasury // Treasury stays in contract
      });
    });

    it("should reject distribution before tournament ends", () => {
      // Create new tournament that's still active
      simnet.callPublicFn("pathfortune", "create-tournament", [
        "u2000000", "u10000000", "u20000000", "u300"
      ], wallet1);
      simnet.callPublicFn("pathfortune", "enter-tournament", ["u2", "u10000000"], wallet2);
      
      const { result } = simnet.callPublicFn("pathfortune", "distribute-prizes", [
        "u2",
        `[${wallet2}]`
      ], deployer);
      
      expect(result).toBeErr(109); // ERR-TOURNAMENT-NOT-ENDED
    });

    it("should reject distribution from unauthorized user", () => {
      const { result } = simnet.callPublicFn("pathfortune", "distribute-prizes", [
        "u1",
        `[${wallet2}]`
      ], wallet1); // Not contract owner
      
      expect(result).toBeErr(108); // ERR-UNAUTHORIZED
    });

    it("should reject double distribution", () => {
      // First distribution
      simnet.callPublicFn("pathfortune", "distribute-prizes", [
        "u1",
        `[${wallet2}]`
      ], deployer);
      
      // Second distribution attempt
      const { result } = simnet.callPublicFn("pathfortune", "distribute-prizes", [
        "u1",
        `[${wallet2}]`
      ], deployer);
      
      expect(result).toBeErr(110); // ERR-PRIZES-ALREADY-DISTRIBUTED
    });
  });
});
