import { HolographicCard } from './HolographicCard';
import { GlitchText } from './GlitchText';
import { NeonButton } from './ui/neon-button';
import { Tournament } from '@/hooks/useTournaments';
import { Users, Clock, Target, Zap, Play } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';

interface TournamentCardProps {
  tournament: Tournament;
  onEnter: (tournamentId: string) => void;
  onPlay?: (tournamentId: string) => void;
  checkUserParticipation?: (tournamentId: string, userAddress: string) => Promise<boolean>;
}

export const TournamentCard = ({ tournament, onEnter, onPlay, checkUserParticipation }: TournamentCardProps) => {
  const { walletAddress } = useWallet();
  const [hasParticipated, setHasParticipated] = useState(false);
  const [checkingParticipation, setCheckingParticipation] = useState(false);

  useEffect(() => {
    const checkParticipation = async () => {
      if (walletAddress && checkUserParticipation) {
        setCheckingParticipation(true);
        try {
          const participated = await checkUserParticipation(tournament.id, walletAddress);
          setHasParticipated(participated);
        } catch (error) {
          console.error('Error checking participation:', error);
        } finally {
          setCheckingParticipation(false);
        }
      }
    };

    checkParticipation();
  }, [tournament.id, walletAddress, checkUserParticipation]);

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-primary/20 text-primary border-primary/50';
      case 'active':
        return 'bg-secondary/20 text-secondary border-secondary/50';
      case 'ended':
        return 'bg-destructive/20 text-destructive border-destructive/50';
    }
  };

  const progress = (tournament.currentPool / tournament.targetPool) * 100;
  const timeRemaining = tournament.endBlock 
    ? `${Math.floor((tournament.endBlock - 100000) / 144)} days` 
    : '~7 days';

  // Create subtle card variation based on tournament ID while keeping same structure
  const cardVariant = parseInt(tournament.id) % 3;
  
  // Different gradient backgrounds for variety
  const getCardGradient = () => {
    switch (cardVariant) {
      case 0:
        return 'bg-gradient-to-br from-primary/5 via-background to-secondary/5';
      case 1:
        return 'bg-gradient-to-br from-secondary/5 via-background to-primary/5';
      case 2:
        return 'bg-gradient-to-br from-primary/3 via-secondary/3 to-background';
      default:
        return 'bg-gradient-to-br from-primary/5 via-background to-secondary/5';
    }
  };

  return (
    <HolographicCard className={`flex flex-col h-full ${getCardGradient()}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <GlitchText as="span" className="text-lg font-bold text-primary">
              #{tournament.id}
            </GlitchText>
          </div>
          <div>
            <Badge className={`${getStatusColor(tournament.status)} font-mono uppercase text-xs`}>
              {tournament.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Pool Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Pool Progress</span>
          <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500 matrix-glow-green"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{tournament.currentPool} STX</span>
          <span className="text-xs text-muted-foreground">{tournament.targetPool} STX</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card/50 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Runners</span>
          </div>
          <div className="text-xl font-bold text-primary">{tournament.participantCount}</div>
        </div>
        
        <div className="bg-card/50 rounded-lg p-3 border border-secondary/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground">Entry</span>
          </div>
          <div className="text-xl font-bold text-secondary">{tournament.minEntryPrice}</div>
        </div>
      </div>

      {tournament.status !== 'pending' && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted/20 rounded">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Time Left:</span>
          <span className="text-sm font-bold text-foreground">{timeRemaining}</span>
        </div>
      )}

      {/* Creator */}
      <div className="text-xs text-muted-foreground mb-4 p-2 bg-card/30 rounded font-mono">
        Creator: <span className="text-primary">{tournament.creator.slice(0, 8)}...{tournament.creator.slice(-4)}</span>
      </div>

      {/* Action Buttons */}
      {tournament.status !== 'ended' && (
        <div className="mt-auto space-y-2">
          {hasParticipated && tournament.status === 'active' && onPlay ? (
            <NeonButton
              variant="secondary"
              className="w-full gap-2"
              onClick={() => onPlay(tournament.id)}
            >
              <Play className="w-4 h-4" />
              PLAY NOW
            </NeonButton>
          ) : hasParticipated && tournament.status !== 'active' ? (
            <div className="text-center text-sm text-primary">
              {tournament.status === 'pending' ? '⏳ Tournament not started yet' : 
               tournament.status === 'ended' ? '🏁 Tournament has ended' : null}
            </div>
          ) : !hasParticipated && tournament.status === 'active' ? (
            <div className="text-center text-sm text-destructive">
              ❌ You must participate in the pool to play
            </div>
          ) : null}
          
          {!hasParticipated && (
            <NeonButton
              variant="default"
              className="w-full"
              onClick={() => onEnter(tournament.id)}
              disabled={checkingParticipation}
            >
              {checkingParticipation ? 'CHECKING...' : 'JACK IN'}
            </NeonButton>
          )}
          
          {hasParticipated && tournament.status !== 'active' && (
            <div className="text-center text-sm text-primary">
              ✓ You're in this tournament
            </div>
          )}
        </div>
      )}
    </HolographicCard>
  );
};
