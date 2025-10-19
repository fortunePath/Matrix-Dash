import { useState } from 'react';
import { NeonButton } from './ui/neon-button';
import { useContract } from '@/hooks/useContract';
import { useTournaments } from '@/hooks/useTournaments';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { Trophy, Award } from 'lucide-react';

interface TournamentEndManagerProps {
  tournamentId: string;
}

export const TournamentEndManager = ({ tournamentId }: TournamentEndManagerProps) => {
  const { endTournament, distributePrizes } = useContract();
  const { getTournamentById, getTournamentParticipants, calculateWinners } = useTournaments();
  const { isConnected, walletAddress } = useWallet();
  const tournament = getTournamentById(tournamentId);
  
  // Only show to tournament creator
  const isCreator = tournament && walletAddress && tournament.creator === walletAddress;

  const [isEnding, setIsEnding] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  const handleEndTournament = async () => {
    if (!tournament || !isConnected) {
      toast.error('Wallet not connected');
      return;
    }

    setIsEnding(true);

    try {
      const result = await endTournament(Number(tournamentId));

      if (result.success) {
        toast.success('Tournament ended successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Failed to end tournament', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error: any) {
      console.error('Tournament end error:', error);
      toast.error('Failed to end tournament', {
        description: error.message || 'Unknown error occurred',
      });
    } finally {
      setIsEnding(false);
    }
  };

  const handleDistributePrizes = async () => {
    if (!tournament || !isConnected) {
      toast.error('Wallet not connected');
      return;
    }

    if (tournament.status !== 'ended') {
      toast.error('Tournament must be ended first');
      return;
    }

    setIsDistributing(true);

    try {
      const participants = await getTournamentParticipants(tournamentId);

      if (participants.length === 0) {
        toast.error('No participants found for this tournament');
        setIsDistributing(false);
        return;
      }

      const winners = calculateWinners(participants);

      const result = await distributePrizes(Number(tournamentId), winners);

      if (result.success) {
        toast.success(`Prizes distributed to ${winners.length} winners!`, {
          description: 'Top 10% of players have received their prizes',
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Failed to distribute prizes', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error: any) {
      console.error('Prize distribution error:', error);
      toast.error('Failed to distribute prizes', {
        description: error.message || 'Unknown error occurred',
      });
    } finally {
      setIsDistributing(false);
    }
  };

  if (!tournament || !isCreator) return null;

  return (
    <div className="bg-card/30 rounded-lg border neon-border p-6 space-y-4">
      <h3 className="text-xl font-bold text-primary flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        Tournament Management
      </h3>

      <div className="space-y-3">
        {tournament.status === 'active' && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Tournament is active. Click below to end it when time expires.
            </p>
            <NeonButton
              onClick={handleEndTournament}
              disabled={isEnding || !isConnected}
              className="w-full"
              variant="warning"
            >
              {isEnding ? 'Ending...' : 'End Tournament'}
            </NeonButton>
          </div>
        )}

        {tournament.status === 'ended' && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Tournament has ended. Distribute prizes to top 10% of winners.
            </p>
            <NeonButton
              onClick={handleDistributePrizes}
              disabled={isDistributing || !isConnected}
              className="w-full gap-2"
              variant="secondary"
            >
              <Award className="w-4 h-4" />
              {isDistributing ? 'Distributing...' : 'Distribute Prizes'}
            </NeonButton>
          </div>
        )}

        {tournament.status === 'pending' && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Tournament is pending. Wait for more participants to join.
          </p>
        )}
      </div>
    </div>
  );
};
