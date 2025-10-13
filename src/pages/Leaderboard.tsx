import { Link } from 'react-router-dom';
import { MatrixBackground } from '@/components/MatrixBackground';
import { GlitchText } from '@/components/GlitchText';
import { NeonButton } from '@/components/ui/neon-button';
import { WalletConnect } from '@/components/WalletConnect';
import { HolographicCard } from '@/components/HolographicCard';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';

const Leaderboard = () => {
  const allTimeLeaders = [
    { rank: 1, address: 'SP2J6...ABCD', totalWinnings: 450, tournaments: 23, avgScore: 18500 },
    { rank: 2, address: 'SP3K9...WXYZ', totalWinnings: 380, tournaments: 19, avgScore: 17200 },
    { rank: 3, address: 'SP1A2...EFGH', totalWinnings: 320, tournaments: 15, avgScore: 16800 },
    { rank: 4, address: 'SP9X8...IJKL', totalWinnings: 275, tournaments: 18, avgScore: 15900 },
    { rank: 5, address: 'SP7Y5...MNOP', totalWinnings: 240, tournaments: 12, avgScore: 15200 },
    { rank: 6, address: 'SP4B3...QRST', totalWinnings: 210, tournaments: 14, avgScore: 14500 },
    { rank: 7, address: 'SP6C5...UVWX', totalWinnings: 185, tournaments: 11, avgScore: 13800 },
    { rank: 8, address: 'SP8D7...YZAB', totalWinnings: 160, tournaments: 9, avgScore: 13100 },
    { rank: 9, address: 'SP0E9...CDEF', totalWinnings: 140, tournaments: 8, avgScore: 12400 },
    { rank: 10, address: 'SP2F1...GHIJ', totalWinnings: 125, tournaments: 7, avgScore: 11900 },
  ];

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
                <div className="text-3xl font-bold text-primary">2,500 STX</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Total Tournaments</div>
                <div className="text-3xl font-bold text-secondary">156</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Total Players</div>
                <div className="text-3xl font-bold text-primary">1,234</div>
              </div>
            </div>
          </HolographicCard>

          <div className="space-y-4">
            {allTimeLeaders.map((leader, index) => (
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
                      {leader.address}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Winnings: </span>
                        <span className="font-bold text-primary">{leader.totalWinnings} STX</span>
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
            ))}
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
