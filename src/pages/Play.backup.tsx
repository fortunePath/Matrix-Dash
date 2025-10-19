import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MatrixBackground } from '@/components/MatrixBackground';
import { GlitchText } from '@/components/GlitchText';
import { NeonButton } from '@/components/ui/neon-button';
import { useTournaments } from '@/hooks/useTournaments';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowLeft, Trophy, Target, Clock } from 'lucide-react';
import { HolographicCard } from '@/components/HolographicCard';
import { SimpleMatrixGame } from '@/components/SimpleMatrixGame';
import { TournamentEndManager } from '@/components/TournamentEndManager';
import { toast } from 'sonner';

// Simple game session proof functions
const generateGameSessionHash = (score: number, playerAddress: string, timestamp: number): string => {
  const data = `${score}-${playerAddress}-${timestamp}`;
  // Simple hash function for demo - in production, use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Ensure we return exactly 32 characters (16 bytes) hex string
  return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).slice(0, 32);
};

const signGameSession = async (gameSessionHash: string): Promise<string> => {
  // Simple signature for demo - in production, use wallet signing
  const baseSignature = `${gameSessionHash}${Date.now().toString(16)}`;
  // Ensure exactly 64 characters (32 bytes) hex string
  let signature = '';
  for (let i = 0; i < baseSignature.length && signature.length < 64; i++) {
    const char = baseSignature.charCodeAt(i);
    signature += char.toString(16).padStart(2, '0');
  }
  return signature.padEnd(64, '0').slice(0, 64);
};

const Play = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentIdFromURL = urlParams.get('tournament');
  const { getTournamentById } = useTournaments();
  const { submitScore } = useContract();
  const { isConnected, walletAddress } = useWallet();
  const tournament = tournamentIdFromURL ? getTournamentById(tournamentIdFromURL) : null;

  const [gameStatus, setGameStatus] = useState<'lobby' | 'playing' | 'ended'>('lobby');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; address: string; score: number }>>([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number>(0);
  
  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  const handleSubmitScore = async (finalScore: number) => {
    if (!tournament || !tournamentIdFromURL || !isConnected) {
      return;
    }

    if (tournament.status !== 'active') {
      toast.error('Cannot submit score - tournament is not active');
      return;
    }

    setIsSubmittingScore(true);

    try {
      // Generate game session proof data
      const gameSessionHash = generateGameSessionHash(finalScore, walletAddress || '', Date.now());
      const signature = await signGameSession(gameSessionHash);
      
      const result = await submitScore(Number(tournamentIdFromURL), finalScore, gameSessionHash, signature);

      if (result.success) {
        toast.success('Score submitted successfully!', {
          description: `Your score of ${finalScore.toLocaleString()} has been recorded`,
        });
        // Refresh leaderboard after successful submission
        setTimeout(() => {
          fetchLeaderboard();
          checkUserScore();
        }, 2000);
      } else {
        toast.error('Failed to submit score', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error: any) {
      console.error('Score submission error:', error);
      toast.error('Failed to submit score', {
        description: error.message || 'Unknown error occurred',
      });
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleGameEnd = (finalScore: number) => {
    setScore(finalScore);
    setGameStatus('ended');

    if (tournament && tournamentIdFromURL && isConnected) {
      handleSubmitScore(finalScore);
    }
  };

  // Function to fetch leaderboard data
  const fetchLeaderboard = async () => {
    if (!tournament || !tournamentIdFromURL) return;

    try {
      console.log(' Fetching leaderboard...');
      
      // Use localStorage for demo leaderboard since contract doesn't have enumeration
      const leaderboardKey = `tournament_${tournamentIdFromURL}_leaderboard`;
      const storedLeaderboard = localStorage.getItem(leaderboardKey);
      
      let leaderboardEntries: Array<{ address: string; score: number }> = [];
      
      if (storedLeaderboard) {
        leaderboardEntries = JSON.parse(storedLeaderboard);
      }
      
      // Also check current user's score from contract
      if (walletAddress) {
        const userScoreData = await contractAPI.checkScoreSubmission(Number(tournamentIdFromURL), walletAddress);
        
        if (userScoreData.hasScore) {
          // Update or add user's score to leaderboard
          const existingEntryIndex = leaderboardEntries.findIndex(entry => entry.address === walletAddress);
          
          if (existingEntryIndex >= 0) {
            // Update existing score if new score is higher
            if (userScoreData.score > leaderboardEntries[existingEntryIndex].score) {
              leaderboardEntries[existingEntryIndex].score = userScoreData.score;
            }
          } else {
            // Add new entry
            leaderboardEntries.push({
              address: walletAddress,
              score: userScoreData.score
            });
          }
          
          // Save updated leaderboard
          localStorage.setItem(leaderboardKey, JSON.stringify(leaderboardEntries));
        }
      }
      
      // Sort and rank
      const sortedParticipants = leaderboardEntries
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          rank: index + 1,
          address: entry.address,
          score: entry.score
        }));
      
      setLeaderboard(sortedParticipants);
      console.log(' Leaderboard updated:', sortedParticipants);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

  // Function to check current user's score
  const checkUserScore = async () => {
    if (!tournament || !tournamentIdFromURL || !walletAddress) return;

    try {
      console.log(' Checking user score...');
      
      const scoreData = await contractAPI.checkScoreSubmission(Number(tournamentIdFromURL), walletAddress);
      
      if (scoreData.hasScore) {
        setUserScore(scoreData.score);
        console.log(` User score found: ${scoreData.score}`);
        
        // Find user's rank in leaderboard
        const userRank = leaderboard.findIndex(entry => entry.address === walletAddress) + 1;
        setCurrentUserRank(userRank > 0 ? userRank : null);
      } else {
        setUserScore(0);
        setCurrentUserRank(null);
        console.log(' No score found for user');
      }
    } catch (error) {
      console.error('Error checking user score:', error);
    }
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
    if (tournament && tournamentIdFromURL) {
      // Initial fetch
      fetchLeaderboard();
      checkUserScore();
      
      // Set up periodic refresh for live updates
      const interval = setInterval(() => {
        fetchLeaderboard();
        checkUserScore();
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [tournament, tournamentIdFromURL, walletAddress]);

  // Update user rank when leaderboard changes
  useEffect(() => {
    if (walletAddress && leaderboard.length > 0) {
      const userRank = leaderboard.findIndex(entry => entry.address === walletAddress) + 1;
      setCurrentUserRank(userRank > 0 ? userRank : null);
    }
  }, [leaderboard, walletAddress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Always show test game if no tournament or tournament not found
  if (!tournament) {
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

          <div className="text-center mb-8">
            <GlitchText as="h1" className="text-5xl mb-4 text-primary">
              TEST GAME MODE
            </GlitchText>
            <p className="text-lg text-muted-foreground">
              Practice your skills before entering a tournament
            </p>
          </div>

          <div className="flex items-center justify-center">
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
                  >
                    START TEST GAME
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
                    onGameEnd={handleGameEnd}
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
                    TEST COMPLETED
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
                  RANK #{currentUserRank || '-'}
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
                >
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
                  onGameEnd={handleGameEnd}
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
                <p className="text-xl text-secondary mb-4">Final Score: {score.toLocaleString()}</p>
                
                {isSubmittingScore && (
                  <div className="text-sm text-primary mb-4 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    Submitting score to blockchain...
                  </div>
                )}
                
                <NeonButton
                  size="xl"
                  variant="default"
                  onClick={() => setGameStatus('lobby')}
                  disabled={isSubmittingScore}
                >
                  PLAY AGAIN
                </NeonButton>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel - Leaderboard */}
        <div className="w-80 bg-card/50 backdrop-blur-sm border-l border-primary/30 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <GlitchText as="h3" className="text-2xl text-secondary">
              LIVE RANKINGS
            </GlitchText>
            <div className="text-xs text-muted-foreground">
              Updates every 10s
            </div>
          </div>

          {/* Current User Score */}
          {userScore > 0 && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded">
              <div className="text-sm text-primary font-bold mb-1">Your Best Score</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {userScore.toLocaleString()}
                </span>
                <span className="text-sm text-secondary">
                  Rank #{currentUserRank || 'N/A'}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground mb-2">No scores yet</div>
                <div className="text-xs text-muted-foreground">Be the first to play!</div>
              </div>
            ) : (
              leaderboard.map((entry) => {
                const isCurrentUser = entry.address === walletAddress;
                return (
                  <div
                    key={entry.rank}
                    className={`p-3 rounded border transition-all ${
                      isCurrentUser
                        ? 'border-primary bg-primary/20 matrix-glow'
                        : entry.rank <= 3
                        ? 'border-secondary bg-secondary/10 matrix-glow-green'
                        : 'border-primary/20 bg-card/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-lg font-bold ${
                        isCurrentUser ? 'text-primary' : 'text-primary'
                      }`}>
                        #{entry.rank}
                        {isCurrentUser && <span className="text-xs ml-1">(YOU)</span>}
                      </span>
                      <span className={`text-xl font-bold ${
                        isCurrentUser ? 'text-primary' : 'text-primary'
                      }`}>
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {isCurrentUser ? 'You' : `${entry.address.slice(0, 8)}...${entry.address.slice(-4)}`}
                    </div>
                  </div>
                );
              })
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

          {/* Debug Info */}
          {walletAddress && (
            <div className="mt-8 p-3 bg-muted/10 rounded border border-muted/30">
              <h4 className="text-xs font-bold text-muted-foreground mb-2">DEBUG INFO</h4>
              <div className="text-xs space-y-1">
                <div>Tournament: {tournamentIdFromURL}</div>
                <div>Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}</div>
                <div>User Score: {userScore}</div>
                <div>User Rank: {currentUserRank || 'N/A'}</div>
                <div>Leaderboard Entries: {leaderboard.length}</div>
              </div>
              <NeonButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  fetchLeaderboard();
                  checkUserScore();
                }}
                className="w-full mt-2 text-xs"
              >
                Refresh Data
              </NeonButton>
            </div>
          )}

          {/* Tournament Management */}
          {tournamentIdFromURL && (
            <div className="mt-8">
              <TournamentEndManager tournamentId={tournamentIdFromURL} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Play;
