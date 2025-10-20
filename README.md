# Matrix Dash

A competitive platformer game built on the Stacks blockchain where players compete in tournaments for STX prizes. Experience Matrix-themed gameplay with skill-based competition and blockchain-powered prize distribution.

## Features

- **Competitive Tournaments**: Join STX-powered tournaments with real prizes
- **Skill-Based Gameplay**: Pure platformer mechanics with precision timing
- **Blockchain Integration**: Stacks blockchain for secure prize distribution
- **Prize Pool Distribution**: Top 10% of players share 80% of the prize pool
- **Matrix Theme**: Cyberpunk aesthetic with neon visuals and glitch effects
- **Real-Time Leaderboards**: Track your progress and ranking
- **Wallet Integration**: Connect Stacks wallet for seamless gameplay

## Game Mechanics

### Tournament Structure
- Tournament creators set minimum entry fees and contribute to prize pools
- Players pay entry fees to join tournaments
- Target pool size determines when tournaments begin
- Tournament duration is configurable (1 day to 1 week)
- Top 10% of participants receive 80% of the prize pool
- 10% goes to treasury, 10% is burned for deflation

### Prize Distribution
- **Winners (80%)**: Distributed among top 10% of players
- **Treasury (10%)**: Platform development and maintenance
- **Burn (10%)**: Deflationary mechanism

### Scoring System
- Submit scores during active tournaments
- Cryptographic proof prevents cheating
- Best score per player counts for ranking
- Rate limiting prevents spam submissions

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom Matrix-themed styling
- **Radix UI** components for accessible UI
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Lucide React** for icons

### Blockchain
- **Stacks blockchain** for smart contracts
- **Clarity** smart contract language
- **Stacks Connect** for wallet integration
- **STX token** for entry fees and prizes

### Smart Contract Features
- Tournament creation and management
- Player registration and scoring
- Automated prize distribution
- Player statistics tracking
- Anti-cheat mechanisms with cryptographic proofs

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd Matrix-Dash
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── MatrixBackground.tsx
│   ├── SimpleMatrixGame.tsx
│   └── TournamentCard.tsx
├── pages/              # Route components
│   ├── Index.tsx       # Landing page
│   ├── Tournaments.tsx # Tournament listings
│   ├── Play.tsx        # Game interface
│   └── Leaderboard.tsx # Rankings
├── contexts/           # React contexts
│   └── WalletContext.tsx
├── hooks/              # Custom React hooks
│   ├── useContract.ts
│   └── useTournaments.ts
└── lib/                # Utilities
    ├── contract.ts     # Smart contract interactions
    └── utils.ts        # Helper functions

contracts/
├── contracts/
│   └── main2.clar      # Tournament smart contract
└── tests/              # Contract tests
```

## Smart Contract

The game is powered by a Clarity smart contract deployed on Stacks that handles:

- Tournament creation and lifecycle management
- Player registration and entry fee collection
- Score submission with cryptographic verification
- Automated prize distribution
- Player statistics and leaderboards

### Key Constants
- Minimum entry price: 1 STX
- Minimum pool contribution: 5 STX
- Minimum target pool: 10 STX
- Tournament duration: 1 day to 1 week

## Getting Started

1. **Connect Wallet**: Link your Stacks wallet to participate
2. **Browse Tournaments**: View available tournaments and their details
3. **Join Tournament**: Pay entry fee to participate
4. **Play Game**: Complete runs and submit your best scores
5. **Win Prizes**: Top performers receive STX rewards

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Testing
Smart contract tests are located in `contracts/tests/` and can be run using Clarinet.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the repository or contact the development team.
