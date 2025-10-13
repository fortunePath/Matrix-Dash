;; title: PathFortune - Geometry Dash Tournament Platform
;; version: 2.0.0
;; summary: A tournament-based platform where players compete in Geometry Dash-style games for STX prizes
;; description: Tournament creators set entry fees and prize pools. Top 10% of players share 80% of the pool, 10% goes to treasury, 10% is burned

;; constants
(define-constant MIN-ENTRY-PRICE u1000000) ;; 1 STX minimum entry price
(define-constant MIN-POOL-CONTRIBUTION u5000000) ;; 5 STX minimum pool contribution from creator
(define-constant MIN-TARGET-POOL u10000000) ;; 10 STX minimum target pool
(define-constant WINNERS-PERCENTAGE u80) ;; 80% to winners
(define-constant TREASURY-PERCENTAGE u10) ;; 10% to treasury
(define-constant BURN-PERCENTAGE u10) ;; 10% burned for deflation
(define-constant MIN-TOURNAMENT-DURATION u144) ;; ~1 day in blocks (10 min blocks)
(define-constant MAX-TOURNAMENT-DURATION u1008) ;; ~1 week in blocks

;; error codes
(define-constant ERR-INSUFFICIENT-ENTRY-AMOUNT (err u100))
(define-constant ERR-INSUFFICIENT-POOL-CONTRIBUTION (err u101))
(define-constant ERR-TOURNAMENT-NOT-FOUND (err u102))
(define-constant ERR-TOURNAMENT-NOT-ACTIVE (err u103))
(define-constant ERR-INVALID-TARGET-POOL (err u104))
(define-constant ERR-ALREADY-PARTICIPATED (err u105))
(define-constant ERR-INVALID-DURATION (err u106))
(define-constant ERR-TRANSFER-FAILED (err u107))
(define-constant ERR-UNAUTHORIZED (err u108))
(define-constant ERR-TOURNAMENT-NOT-ENDED (err u109))
(define-constant ERR-PRIZES-ALREADY-DISTRIBUTED (err u110))
(define-constant ERR-INVALID-SCORE (err u111))
(define-constant ERR-POOL-TARGET-REACHED (err u112))

;; data vars
(define-data-var contract-owner principal tx-sender)
(define-data-var next-tournament-id uint u1)
(define-data-var treasury-balance uint u0)
(define-data-var total-burned uint u0)

;; data maps
(define-map tournaments
  uint ;; tournament-id
  {
    creator: principal,
    min-entry-price: uint,
    pool-contribution: uint,
    target-pool: uint,
    duration: uint, ;; in blocks
    start-block: (optional uint),
    end-block: (optional uint),
    current-pool: uint,
    participant-count: uint,
    status: (string-ascii 20), ;; "pending", "active", "ended", "distributed"
    created-at: uint
  }
)

(define-map tournament-participants
  { tournament-id: uint, player: principal }
  {
    entry-amount: uint,
    entry-block: uint,
    best-score: uint,
    games-played: uint,
    final-rank: (optional uint)
  }
)

(define-map tournament-scores
  { tournament-id: uint, player: principal, game-number: uint }
  {
    score: uint,
    submitted-at: uint
  }
)

(define-map tournament-leaderboard
  { tournament-id: uint, rank: uint }
  {
    player: principal,
    score: uint
  }
)

(define-map player-stats
  principal
  {
    tournaments-played: uint,
    total-entry-fees: uint,
    total-winnings: uint,
    tournaments-won: uint,
    best-score: uint
  }
)

;; public functions

;; 1. CREATE TOURNAMENT - Tournament creator sets minimum entry price, pool contribution, target pool, and duration
(define-public (create-tournament 
  (min-entry-price uint)
  (pool-contribution uint)
  (target-pool uint)
  (duration uint))
  (let (
    (tournament-id (var-get next-tournament-id))
    (creator tx-sender)
  )
    ;; Validate inputs
    (asserts! (>= min-entry-price MIN-ENTRY-PRICE) ERR-INSUFFICIENT-ENTRY-AMOUNT)
    (asserts! (>= pool-contribution MIN-POOL-CONTRIBUTION) ERR-INSUFFICIENT-POOL-CONTRIBUTION)
    (asserts! (>= target-pool MIN-TARGET-POOL) ERR-INVALID-TARGET-POOL)
    (asserts! (and (>= duration MIN-TOURNAMENT-DURATION) (<= duration MAX-TOURNAMENT-DURATION)) ERR-INVALID-DURATION)
    
    ;; Transfer pool contribution from creator
    (match (stx-transfer? pool-contribution creator (as-contract tx-sender))
      success
        (begin
          ;; Create tournament
          (map-set tournaments tournament-id {
            creator: creator,
            min-entry-price: min-entry-price,
            pool-contribution: pool-contribution,
            target-pool: target-pool,
            duration: duration,
            start-block: none,
            end-block: none,
            current-pool: pool-contribution,
            participant-count: u0,
            status: "pending",
            created-at: stacks-block-height
          })
          
          ;; Increment tournament counter
          (var-set next-tournament-id (+ tournament-id u1))
          
          (ok tournament-id)
        )
      error ERR-TRANSFER-FAILED
    )
  )
)

;; 2. ENTER TOURNAMENT - Players pay entry amount (>= min price) to join tournament
(define-public (enter-tournament (tournament-id uint) (entry-amount uint))
  (let (
    (player tx-sender)
    (tournament (unwrap! (map-get? tournaments tournament-id) ERR-TOURNAMENT-NOT-FOUND))
    (min-entry-price (get min-entry-price tournament))
    (current-pool (get current-pool tournament))
    (target-pool (get target-pool tournament))
    (new-pool (+ current-pool entry-amount))
  )
    ;; Check tournament is in pending status
    (asserts! (is-eq (get status tournament) "pending") ERR-TOURNAMENT-NOT-ACTIVE)
    
    ;; Check entry amount meets minimum
    (asserts! (>= entry-amount min-entry-price) ERR-INSUFFICIENT-ENTRY-AMOUNT)
    
    ;; Check player hasn't already joined
    (asserts! (is-none (map-get? tournament-participants { tournament-id: tournament-id, player: player })) ERR-ALREADY-PARTICIPATED)
    
    ;; Check that adding this entry won't exceed target (unless it exactly reaches it)
    (asserts! (<= new-pool target-pool) ERR-POOL-TARGET-REACHED)
    
    ;; Transfer entry amount
    (match (stx-transfer? entry-amount player (as-contract tx-sender))
      success
        (begin
          ;; Add participant
          (map-set tournament-participants 
            { tournament-id: tournament-id, player: player }
            {
              entry-amount: entry-amount,
              entry-block: stacks-block-height,
              best-score: u0,
              games-played: u0,
              final-rank: none
            }
          )
          
          ;; Update tournament
          (let ((new-participant-count (+ (get participant-count tournament) u1))
                (tournament-should-start (>= new-pool target-pool)))
            (map-set tournaments tournament-id
              (merge tournament {
                participant-count: new-participant-count,
                current-pool: new-pool,
                status: (if tournament-should-start "active" "pending"),
                start-block: (if tournament-should-start (some stacks-block-height) (get start-block tournament)),
                end-block: (if tournament-should-start (some (+ stacks-block-height (get duration tournament))) (get end-block tournament))
              })
            )
          )
          
          ;; Update player stats
          (update-player-tournament-stats player entry-amount)
          
          (ok true)
        )
      error ERR-TRANSFER-FAILED
    )
  )
)

;; 3. SUBMIT SCORE - Players submit their game scores during active tournament
(define-public (submit-score (tournament-id uint) (score uint))
  (let (
    (player tx-sender)
    (tournament (unwrap! (map-get? tournaments tournament-id) ERR-TOURNAMENT-NOT-FOUND))
    (participant (unwrap! (map-get? tournament-participants { tournament-id: tournament-id, player: player }) ERR-UNAUTHORIZED))
  )
    ;; Check tournament is active
    (asserts! (is-eq (get status tournament) "active") ERR-TOURNAMENT-NOT-ACTIVE)
    
    ;; Check tournament hasn't ended
    (asserts! (< stacks-block-height (unwrap! (get end-block tournament) ERR-TOURNAMENT-NOT-FOUND)) ERR-TOURNAMENT-NOT-ACTIVE)
    
    ;; Validate score (must be positive)
    (asserts! (> score u0) ERR-INVALID-SCORE)
    
    (let ((new-games-played (+ (get games-played participant) u1)))
      ;; Record the score
      (map-set tournament-scores
        { tournament-id: tournament-id, player: player, game-number: new-games-played }
        {
          score: score,
          submitted-at: stacks-block-height
        }
      )
      
      ;; Update participant's best score and games played
      (map-set tournament-participants
        { tournament-id: tournament-id, player: player }
        (merge participant {
          best-score: (if (> score (get best-score participant)) score (get best-score participant)),
          games-played: new-games-played
        })
      )
      
      ;; Update player's global best score
      (update-player-best-score player score)
      
      (ok true)
    )
  )
)

;; 4. END TOURNAMENT - Can be called by anyone to end tournament when time expires
(define-public (end-tournament (tournament-id uint))
  (let (
    (tournament (unwrap! (map-get? tournaments tournament-id) ERR-TOURNAMENT-NOT-FOUND))
  )
    ;; Check tournament is active
    (asserts! (is-eq (get status tournament) "active") ERR-TOURNAMENT-NOT-ACTIVE)
    
    ;; Check tournament time has ended
    (asserts! (>= stacks-block-height (unwrap! (get end-block tournament) ERR-TOURNAMENT-NOT-FOUND)) ERR-TOURNAMENT-NOT-ENDED)
    
    ;; Update tournament status
    (map-set tournaments tournament-id
      (merge tournament { status: "ended" })
    )
    
    (ok true)
  )
)

;; 5. DISTRIBUTE PRIZES - Distribute prizes to winners after tournament ends
(define-public (distribute-prizes (tournament-id uint) (winners (list 100 principal)))
  (let (
    (tournament (unwrap! (map-get? tournaments tournament-id) ERR-TOURNAMENT-NOT-FOUND))
    (current-pool (get current-pool tournament))
    (winners-amount (/ (* current-pool WINNERS-PERCENTAGE) u100))
    (treasury-amount (/ (* current-pool TREASURY-PERCENTAGE) u100))
    (burn-amount (/ (* current-pool BURN-PERCENTAGE) u100))
  )
    ;; Check tournament has ended
    (asserts! (is-eq (get status tournament) "ended") ERR-TOURNAMENT-NOT-ENDED)
    
    ;; Check prizes haven't been distributed yet
    (asserts! (not (is-eq (get status tournament) "distributed")) ERR-PRIZES-ALREADY-DISTRIBUTED)
    
    ;; Only contract owner can distribute for now (in production, this could be automated)
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
    
    ;; Calculate prize per winner
    (let ((prize-per-winner (/ winners-amount (len winners))))
      ;; Distribute to winners
      (try! (distribute-to-winners tournament-id winners prize-per-winner))
      
      ;; Add to treasury
      (var-set treasury-balance (+ (var-get treasury-balance) treasury-amount))
      
      ;; Burn tokens (send to null address or keep track for burning mechanism)
      (var-set total-burned (+ (var-get total-burned) burn-amount))
      
      ;; Update tournament status
      (map-set tournaments tournament-id
        (merge tournament { status: "distributed" })
      )
      
      (ok true)
    )
  )
)

;; read-only functions

;; Get tournament details
(define-read-only (get-tournament (tournament-id uint))
  (map-get? tournaments tournament-id)
)

;; Get tournament participant info
(define-read-only (get-participant (tournament-id uint) (player principal))
  (map-get? tournament-participants { tournament-id: tournament-id, player: player })
)

;; Get player's game score for specific game
(define-read-only (get-game-score (tournament-id uint) (player principal) (game-number uint))
  (map-get? tournament-scores { tournament-id: tournament-id, player: player, game-number: game-number })
)

;; Get leaderboard position
(define-read-only (get-leaderboard-position (tournament-id uint) (rank uint))
  (map-get? tournament-leaderboard { tournament-id: tournament-id, rank: rank })
)

;; Get player statistics
(define-read-only (get-player-stats (player principal))
  (map-get? player-stats player)
)

;; Get contract statistics
(define-read-only (get-contract-stats)
  {
    next-tournament-id: (var-get next-tournament-id),
    treasury-balance: (var-get treasury-balance),
    total-burned: (var-get total-burned),
    contract-balance: (stx-get-balance (as-contract tx-sender))
  }
)

;; Get tournament constants
(define-read-only (get-tournament-constants)
  {
    min-entry-price: MIN-ENTRY-PRICE,
    min-pool-contribution: MIN-POOL-CONTRIBUTION,
    min-target-pool: MIN-TARGET-POOL,
    min-duration: MIN-TOURNAMENT-DURATION,
    max-duration: MAX-TOURNAMENT-DURATION,
    winners-percentage: WINNERS-PERCENTAGE,
    treasury-percentage: TREASURY-PERCENTAGE,
    burn-percentage: BURN-PERCENTAGE
  }
)

;; Check if tournament is active
(define-read-only (is-tournament-active (tournament-id uint))
  (match (map-get? tournaments tournament-id)
    tournament (and 
      (is-eq (get status tournament) "active")
      (< stacks-block-height (unwrap-panic (get end-block tournament)))
    )
    false
  )
)

;; private functions

;; Update player tournament statistics
(define-private (update-player-tournament-stats (player principal) (entry-fee uint))
  (let (
    (current-stats (default-to 
      { tournaments-played: u0, total-entry-fees: u0, total-winnings: u0, tournaments-won: u0, best-score: u0 }
      (map-get? player-stats player)
    ))
  )
    (map-set player-stats player {
      tournaments-played: (+ (get tournaments-played current-stats) u1),
      total-entry-fees: (+ (get total-entry-fees current-stats) entry-fee),
      total-winnings: (get total-winnings current-stats),
      tournaments-won: (get tournaments-won current-stats),
      best-score: (get best-score current-stats)
    })
  )
)

;; Update player's best score
(define-private (update-player-best-score (player principal) (score uint))
  (let (
    (current-stats (default-to 
      { tournaments-played: u0, total-entry-fees: u0, total-winnings: u0, tournaments-won: u0, best-score: u0 }
      (map-get? player-stats player)
    ))
  )
    (if (> score (get best-score current-stats))
      (map-set player-stats player
        (merge current-stats { best-score: score })
      )
      true
    )
  )
)

;; Distribute winnings to winners
(define-private (distribute-to-winners (tournament-id uint) (winners (list 100 principal)) (prize-per-winner uint))
  (fold distribute-single-winner winners (ok prize-per-winner))
)

;; Helper function to distribute prize to single winner
(define-private (distribute-single-winner (winner principal) (prev-result (response uint uint)))
  (match prev-result
    prize-amount
      (match (as-contract (stx-transfer? prize-amount tx-sender winner))
        success 
          (begin
            ;; Update winner's stats
            (update-winner-stats winner prize-amount)
            (ok prize-amount)
          )
        error (err error)
      )
    error (err error)
  )
)

;; Update winner statistics
(define-private (update-winner-stats (winner principal) (prize uint))
  (let (
    (current-stats (default-to 
      { tournaments-played: u0, total-entry-fees: u0, total-winnings: u0, tournaments-won: u0, best-score: u0 }
      (map-get? player-stats winner)
    ))
  )
    (map-set player-stats winner
      (merge current-stats {
        total-winnings: (+ (get total-winnings current-stats) prize),
        tournaments-won: (+ (get tournaments-won current-stats) u1)
      })
    )
  )
)

