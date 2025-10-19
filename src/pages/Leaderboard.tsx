import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MatrixBackground } from '@/components/MatrixBackground';
import { GlitchText } from '@/components/GlitchText';
import { NeonButton } from '@/components/ui/neon-button';
import { WalletConnect } from '@/components/WalletConnect';
import { HolographicCard } from '@/components/HolographicCard';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';

interface LeaderboardEntry {
  rank: number;
  address: string;
  bestScore: number;
  tournaments: number;
  avgScore: number;
}

const Leaderboard = () => {
  const { tournaments } = useTournaments();
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [totalTournaments, setTotalTournaments] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalPrizePool, setTotalPrizePool] = useState(0);

  useEffect(() => {
    const aggregateLeaderboardData = () => {
      console.log('🔄 Aggregating leaderboard data from localStorage...');
      
      const playerStats: { [address: string]: { scores: number[]; tournaments: Set<string> } } = {};
      
      // Get all tournament leaderboards from localStorage
      tournaments.forEach(tournament => {
        const leaderboardKey = `tournament_${tournament.id}_leaderboard`;
        const storedLeaderboard = localStorage.getItem(leaderboardKey);
        
        if (storedLeaderboard) {
          try {
            const leaderboardEntries: Array<{ address: string; score: number; timestamp: number }> = JSON.parse(storedLeaderboard);
            
            leaderboardEntries.forEach(entry => {
              if (!playerStats[entry.address]) {
                playerStats[entry.address] = {
                  scores: [],
                  tournaments: new Set()
                };
              }
              
              playerStats[entry.address].scores.push(entry.score);
              playerStats[entry.address].tournaments.add(tournament.id);
            });
          } catch (error) {
            console.error(`Error parsing leaderboard for tournament ${tournament.id}:`, error);
          }
        }
      });

      // Convert to leaderboard format
      const leaderboardEntries: LeaderboardEntry[] = Object.entries(playerStats)
        .map(([address, stats]) => ({
          address,
          bestScore: Math.max(...stats.scores),
          tournaments: stats.tournaments.size,
          avgScore: Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length),
          rank: 0 // Will be set after sorting
        }))
        .sort((a, b) => b.bestScore - a.bestScore) // Sort by best score
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));

      console.log('✅ Aggregated leaderboard:', leaderboardEntries);
      
      setAllTimeLeaders(leaderboardEntries);
      setTotalPlayers(leaderboardEntries.length);
      setTotalTournaments(tournaments.length);
      
      // Calculate total prize pool from all tournaments
      const totalPool = tournaments.reduce((sum, tournament) => sum + tournament.currentPool, 0);
      setTotalPrizePool(totalPool);
    };

    aggregateLeaderboardData();
  }, [tournaments]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-primary" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-secondary" />;
    if (rank === 3) return <Award className="w-6 h-6 text-primary/60" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'border-primary bg-primary/10 matrix-glow';
    if (rank === 2) return 'border-secondary bg-secondary/10 matrix-glow-green';
    if (rank === 3) return 'border-primary/60 bg-primary/5';
    return 'border-primary/20 bg-card/30';
  };

  return (
    <div className="min-h-screen scanlines">
      <MatrixBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-primary/30 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/tournaments">
                <GlitchText as="h1" className="text-2xl text-primary cursor-pointer">
                  MATRIX DASH
                </GlitchText>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/tournaments" className="text-muted-foreground hover:text-primary transition-colors">
                  TOURNAMENTS
                </Link>
                <Link to="/play" className="text-muted-foreground hover:text-primary transition-colors">
                  PLAY
                </Link>
                <Link to="/leaderboard" className="text-primary font-bold border-b-2 border-primary pb-1">
                  LEADERBOARD
                </Link>
              </nav>
            </div>

            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <GlitchText as="h1" className="text-6xl mb-4 text-secondary">
              HALL OF FAME
            </GlitchText>
            <p className="text-xl text-muted-foreground font-mono">
              All-Time Tournament Champions
            </p>
          </div>

          <HolographicCard glowColor="secondary" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Total Prize Pool</div>
                <div className="text-3xl font-bold text-primary">{totalPrizePool.toLocaleString()} STX</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Total Tournaments</div>
                <div className="text-3xl font-bold text-secondary">{totalTournaments}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Total Players</div>
                <div className="text-3xl font-bold text-primary">{totalPlayers}</div>
              </div>
            </div>
          </HolographicCard>

          <div className="space-y-4">
            {allTimeLeaders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-lg text-muted-foreground mb-2">No leaderboard data yet</div>
                <div className="text-sm text-muted-foreground">Play some tournaments to see rankings!</div>
              </div>
            ) : (
              allTimeLeaders.map((leader, index) => (
                <div
                  key={leader.address}
                  className={`p-6 rounded-lg border-2 transition-all ${getRankStyle(leader.rank)} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 flex justify-center">
                      {getRankIcon(leader.rank)}
                    </div>

                    <div className="flex-1">
                      <div className="font-mono text-lg font-bold text-foreground mb-2">
                        {leader.address.slice(0, 8)}...{leader.address.slice(-4)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Best Score: </span>
                          <span className="font-bold text-primary">{leader.bestScore.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tournaments: </span>
                          <span className="font-bold text-secondary">{leader.tournaments}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Score: </span>
                          <span className="font-bold text-primary">
                            {leader.avgScore.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link to="/tournaments">
              <NeonButton variant="secondary" size="lg" className="gap-2">
                <ArrowLeft className="w-5 h-5" />
                BACK TO TOURNAMENTS
              </NeonButton>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
