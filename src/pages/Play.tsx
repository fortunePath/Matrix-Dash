import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MatrixBackground } from '@/components/MatrixBackground';
import { GlitchText } from '@/components/GlitchText';
import { NeonButton } from '@/components/ui/neon-button';
import { useTournaments } from '@/hooks/useTournaments';
import { ArrowLeft, Trophy, Target, Clock, Zap } from 'lucide-react';
import { HolographicCard } from '@/components/HolographicCard';
import { SimpleMatrixGame } from '@/components/SimpleMatrixGame';

const Play = () => {
  const { tournamentId } = useParams();
  const { getTournamentById } = useTournaments();
  const tournament = tournamentId ? getTournamentById(tournamentId) : null;
  
  const [gameStatus, setGameStatus] = useState<'lobby' | 'playing' | 'ended'>('lobby');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; address: string; score: number }>>([]);
  
  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  useEffect(() => {
    if (tournament && tournament.status === 'active') {
      // Calculate time left based on tournament end block
      if (tournament.endBlock) {
        // This is a simplified calculation - in reality you'd need to fetch current block height
        const estimatedBlocksLeft = tournament.endBlock - (tournament.startBlock || 0);
        const estimatedSecondsLeft = estimatedBlocksLeft * 10; // Assuming ~10 seconds per block
        setTimeLeft(Math.max(0, estimatedSecondsLeft));
      }
    }
  }, [tournament]);

  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, timeLeft]);

  useEffect(() => {
    // Fetch leaderboard data from contract
    const fetchLeaderboard = async () => {
      if (tournament && tournamentId) {
        try {
          // TODO: Implement actual leaderboard fetching from contract
          // For now, show empty until we have real participants with scores
          setLeaderboard([]);
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
          setLeaderboard([]);
        }
      }
    };

    fetchLeaderboard();
  }, [tournament, tournamentId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center scanlines">
        <MatrixBackground />
        <div className="relative z-10 text-center">
          <GlitchText as="h1" className="text-4xl mb-8 text-primary">
            TOURNAMENT NOT FOUND
          </GlitchText>
          <Link to="/tournaments">
            <NeonButton variant="default">
              BACK TO TOURNAMENTS
            </NeonButton>
          </Link>
        </div>
      </div>
    );
  }

  // Lobby View (Before Tournament Starts)
  if (tournament.status === 'pending') {
    return (
      <div className="min-h-screen scanlines">
        <MatrixBackground />
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Link to="/tournaments">
            <NeonButton variant="ghost" className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              EXIT MATRIX
            </NeonButton>
          </Link>

          <div className="max-w-2xl mx-auto text-center">
            <GlitchText as="h1" className="text-5xl mb-8 text-primary">
              TOURNAMENT PENDING
            </GlitchText>

            <HolographicCard className="mb-8">
              <div className="space-y-6">
                <div className="text-6xl font-bold text-primary">
                  {tournament.currentPool} / {tournament.targetPool} STX
                </div>
                
                <div className="w-full bg-muted rounded-full h-4">
                  <div
                    className="bg-secondary h-4 rounded-full transition-all duration-500 matrix-glow-green"
                    style={{ width: `${(tournament.currentPool / tournament.targetPool) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Participants</div>
                    <div className="text-3xl font-bold text-primary">{tournament.participantCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pool Progress</div>
                    <div className="text-3xl font-bold text-secondary">
                      {Math.round((tournament.currentPool / tournament.targetPool) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </HolographicCard>

            <div className="text-lg text-muted-foreground font-mono">
              Waiting for more runners to jack in...
            </div>

            {/* Participant List */}
            <div className="mt-8 max-h-64 overflow-y-auto">
              <div className="text-left space-y-2">
                {tournament.participantCount > 0 ? (
                  Array.from({ length: tournament.participantCount }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-card/30 border border-primary/20 rounded p-3 font-mono text-sm animate-fade-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <span className="text-primary">RUNNER_{i + 1}</span>
                      <span className="text-muted-foreground mx-2">|</span>
                      <span className="text-primary">READY</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm text-muted-foreground mb-2">No participants yet</div>
                    <div className="text-xs text-muted-foreground">Waiting for runners to join...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game View (When Active)
  return (
    <div className="min-h-screen scanlines">
      <MatrixBackground />

      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-primary/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/tournaments">
              <NeonButton variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                EXIT
              </NeonButton>
            </Link>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold font-mono text-primary">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold font-mono text-primary">
                  {score.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" />
                <span className="text-lg font-bold font-mono text-secondary">
                  RANK #-
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="pt-20 h-screen flex">
        {/* Game Canvas */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-4xl">
            {gameStatus === 'lobby' && (
              <div className="aspect-video bg-gradient-to-br from-background via-primary/5 to-secondary/5 rounded-lg border-2 neon-border matrix-glow flex flex-col items-center justify-center">
                <GlitchText as="h2" className="text-4xl mb-8 text-primary">
                  READY TO ENTER THE MATRIX?
                </GlitchText>
                <NeonButton
                  size="xl"
                  variant="secondary"
                  onClick={() => setGameStatus('playing')}
                  className="gap-2"
                >
                  <Zap className="w-6 h-6" />
                  START GAME
                </NeonButton>
                <p className="mt-4 text-sm text-muted-foreground">
                  Use ARROW KEYS to move, SPACEBAR to shoot
                </p>
              </div>
            )}

            {gameStatus === 'playing' && (
              <div className="w-full">
                <SimpleMatrixGame 
                  onScoreUpdate={handleScoreUpdate}
                  isPlaying={gameStatus === 'playing'}
                />
                <div className="text-center mt-4">
                  <NeonButton
                    variant="ghost"
                    onClick={() => setGameStatus('lobby')}
                    className="text-sm"
                  >
                    RESTART GAME
                  </NeonButton>
                </div>
              </div>
            )}
            
            {gameStatus === 'ended' && (
              <div className="aspect-video bg-gradient-to-br from-background via-primary/5 to-secondary/5 rounded-lg border-2 neon-border matrix-glow flex flex-col items-center justify-center">
                <GlitchText as="h2" className="text-4xl mb-4 text-primary">
                  GAME COMPLETED
                </GlitchText>
                <p className="text-xl text-secondary mb-8">Final Score: {score.toLocaleString()}</p>
                <NeonButton
                  size="xl"
                  variant="default"
                  onClick={() => setGameStatus('lobby')}
                >
                  PLAY AGAIN
                </NeonButton>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel - Leaderboard */}
        <div className="w-80 bg-card/50 backdrop-blur-sm border-l border-primary/30 p-6 overflow-y-auto">
          <GlitchText as="h3" className="text-2xl mb-6 text-secondary">
            LIVE RANKINGS
          </GlitchText>

          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground mb-2">No scores yet</div>
                <div className="text-xs text-muted-foreground">Be the first to play!</div>
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`p-3 rounded border transition-all ${
                    entry.rank <= 3
                      ? 'border-secondary bg-secondary/10 matrix-glow-green'
                      : 'border-primary/20 bg-card/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-primary">
                      #{entry.rank}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {entry.address}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Prize Distribution */}
          <div className="mt-8 p-4 bg-muted/20 rounded border border-secondary/30">
            <h4 className="text-sm font-bold text-secondary mb-3">PRIZE POOL</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-primary">{tournament.currentPool} STX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To Winners (80%):</span>
                <span className="font-bold text-secondary">
                  {(tournament.currentPool * 0.8).toFixed(2)} STX
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Treasury (10%):</span>
                <span className="font-bold text-primary">
                  {(tournament.currentPool * 0.1).toFixed(2)} STX
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Burned (10%):</span>
                <span className="font-bold text-destructive">
                  {(tournament.currentPool * 0.1).toFixed(2)} STX
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Play;
