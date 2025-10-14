import { useState, useEffect } from 'react';
import { contractAPI } from '@/lib/contract';
import { useContract } from './useContract';

export interface Tournament {
  id: string;
  creator: string;
  status: 'pending' | 'active' | 'ended';
  minEntryPrice: number;
  poolContribution: number;
  targetPool: number;
  currentPool: number;
  participantCount: number;
  duration: number;
  startBlock?: number;
  endBlock?: number;
  createdAt: number;
}

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createTournament: createTournamentContract, enterTournament: enterTournamentContract } = useContract();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get contract stats to determine how many tournaments exist
        const stats = await contractAPI.getContractStats();
        
        if (stats && stats.next_tournament_id) {
          const tournamentPromises = [];
          const nextId = Number(stats.next_tournament_id);
          
          // Fetch all tournaments from 1 to nextId-1
          for (let i = 1; i < nextId; i++) {
            tournamentPromises.push(contractAPI.getTournament(i));
          }
          
          const tournamentResults = await Promise.all(tournamentPromises);
          
          const validTournaments: Tournament[] = tournamentResults
            .filter(result => result !== null)
            .map((result, index) => ({
              id: (index + 1).toString(),
              creator: result.creator || 'Unknown',
              status: result.status || 'pending',
              minEntryPrice: Number(result.min_entry_price || 0) / 1000000, // Convert from microSTX
              poolContribution: Number(result.pool_contribution || 0) / 1000000,
              targetPool: Number(result.target_pool || 0) / 1000000,
              currentPool: Number(result.current_pool || 0) / 1000000,
              participantCount: Number(result.participant_count || 0),
              duration: Number(result.duration || 0),
              startBlock: result.start_block ? Number(result.start_block) : undefined,
              endBlock: result.end_block ? Number(result.end_block) : undefined,
              createdAt: result.created_at ? Number(result.created_at) : Date.now(),
            }));
          
          setTournaments(validTournaments);
        } else {
          // No tournaments exist yet
          setTournaments([]);
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to fetch tournaments from blockchain');
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const createTournament = async (params: {
    minEntryPrice: number;
    poolContribution: number;
    targetPool: number;
    duration: number;
  }) => {
    try {
      const result = await createTournamentContract(
        Math.round(params.minEntryPrice * 1000000), // Convert to microSTX
        Math.round(params.poolContribution * 1000000),
        Math.round(params.targetPool * 1000000),
        params.duration
      );

      if (result.success) {
        // Refresh tournaments list
        setTimeout(() => {
          window.location.reload(); // Simple refresh for now
        }, 2000);
        
        return { success: true, tournamentId: result.txId };
      } else {
        return { success: false, error: result.error || 'Failed to create tournament' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create tournament' };
    }
  };

  const enterTournament = async (tournamentId: string, entryAmount: number) => {
    try {
      const result = await enterTournamentContract(
        Number(tournamentId),
        Math.round(entryAmount * 1000000) // Convert to microSTX
      );

      if (result.success) {
        // Refresh tournaments list
        setTimeout(() => {
          window.location.reload(); // Simple refresh for now
        }, 2000);
        
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to enter tournament' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to enter tournament' };
    }
  };

  const getTournamentById = (id: string) => {
    return tournaments.find(t => t.id === id);
  };

  const getTournamentParticipants = async (tournamentId: string) => {
    try {
      const tournament = getTournamentById(tournamentId);
      if (!tournament) return [];

      const participants: Array<{ address: string; score: number }> = [];

      return participants;
    } catch (err) {
      console.error('Error fetching tournament participants:', err);
      return [];
    }
  };

  const calculateWinners = (participants: Array<{ address: string; score: number }>) => {
    const sorted = [...participants].sort((a, b) => b.score - a.score);
    const winnerCount = Math.max(1, Math.ceil(sorted.length * 0.1));
    return sorted.slice(0, winnerCount).map(p => p.address);
  };

  return {
    tournaments,
    loading,
    error,
    createTournament,
    enterTournament,
    getTournamentById,
    getTournamentParticipants,
    calculateWinners,
  };
};
