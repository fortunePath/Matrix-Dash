import { HolographicCard } from './HolographicCard';
import { GlitchText } from './GlitchText';
import { NeonButton } from './ui/neon-button';
import { Tournament } from '@/hooks/useTournaments';
import { Users, Clock, Target, Zap } from 'lucide-react';
import { Badge } from './ui/badge';

interface TournamentCardProps {
  tournament: Tournament;
  onEnter: (tournamentId: string) => void;
}

export const TournamentCard = ({ tournament, onEnter }: TournamentCardProps) => {
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/50';
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

  return (
    <HolographicCard className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <GlitchText as="h3" className="text-2xl text-primary">
          #{tournament.id}
        </GlitchText>
        <Badge className={`${getStatusColor(tournament.status)} font-mono uppercase`}>
          {tournament.status}
        </Badge>
      </div>

      {/* Progress Ring */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
            className="transition-all duration-500 matrix-glow-green"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-secondary">{Math.round(progress)}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Pool
          </span>
          <span className="font-bold text-primary">
            {tournament.currentPool} / {tournament.targetPool} STX
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Runners
          </span>
          <span className="font-bold text-accent">{tournament.participantCount}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Min Entry
          </span>
          <span className="font-bold text-warning">{tournament.minEntryPrice} STX</span>
        </div>

        {tournament.status !== 'pending' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Left
            </span>
            <span className="font-bold text-foreground">{timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Creator */}
      <div className="text-xs text-muted-foreground mb-4">
        Creator: <span className="text-accent font-mono">{tournament.creator}</span>
      </div>

      {/* Action Button */}
      {tournament.status !== 'ended' && (
        <NeonButton
          variant="secondary"
          className="w-full mt-auto"
          onClick={() => onEnter(tournament.id)}
        >
          JACK IN
        </NeonButton>
      )}
    </HolographicCard>
  );
};
