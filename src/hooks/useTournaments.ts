import { useState, useEffect } from 'react';
import { contractAPI } from '@/lib/contract';
import { useContract } from './useContract';
import { useWallet } from '@/contexts/WalletContext';

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
  const { walletAddress } = useWallet();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎮 Fetching tournaments...');
        
        // Get contract stats to determine how many tournaments exist
        const stats = await contractAPI.getContractStats();
        console.log('📊 Contract stats:', stats);
        
        if (stats && stats.value && stats.value['next-tournament-id']) {
          const tournamentPromises = [];
          const nextId = Number(stats.value['next-tournament-id'].value);
          
          console.log(`🔢 Found ${nextId - 1} tournaments to fetch`);
          
          // Fetch all tournaments from 1 to nextId-1
          for (let i = 1; i < nextId; i++) {
            tournamentPromises.push(contractAPI.getTournament(i));
          }
          
          const tournamentResults = await Promise.all(tournamentPromises);
          console.log('📋 Tournament results:', tournamentResults);
          
          const validTournaments: Tournament[] = tournamentResults
            .filter(result => result !== null && result.value && result.value.value)
            .map((result, index) => {
              const tournament = result.value.value; // Tournament is wrapped in optional, so we need .value.value
              return {
                id: (index + 1).toString(),
                creator: tournament.creator?.value || 'Unknown',
                status: tournament.status?.value || 'pending',
                minEntryPrice: Number(tournament['min-entry-price']?.value || 0) / 1000000, // Convert from microSTX
                poolContribution: Number(tournament['pool-contribution']?.value || 0) / 1000000,
                targetPool: Number(tournament['target-pool']?.value || 0) / 1000000,
                currentPool: Number(tournament['current-pool']?.value || 0) / 1000000,
                participantCount: Number(tournament['participant-count']?.value || 0),
                duration: Number(tournament.duration?.value || 0),
                startBlock: tournament['start-block']?.value ? Number(tournament['start-block'].value) : undefined,
                endBlock: tournament['end-block']?.value ? Number(tournament['end-block'].value) : undefined,
                createdAt: tournament['created-at']?.value ? Number(tournament['created-at'].value) : Date.now(),
              };
            });
          
          console.log('✅ Processed tournaments:', validTournaments);
          setTournaments(validTournaments);
        } else {
          // No tournaments exist yet
          console.log('📭 No tournaments found');
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

  // Manual refresh function
  const refreshTournaments = async () => {
    console.log('🔄 Manually refreshing tournaments...');
    setLoading(true);
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎮 Fetching tournaments...');
        
        // Get contract stats to determine how many tournaments exist
        const stats = await contractAPI.getContractStats();
        console.log('📊 Contract stats:', stats);
        
        if (stats && stats.value && stats.value['next-tournament-id']) {
          const tournamentPromises = [];
          const nextId = Number(stats.value['next-tournament-id'].value);
          
          console.log(`🔢 Found ${nextId - 1} tournaments to fetch`);
          
          // Fetch all tournaments from 1 to nextId-1
          for (let i = 1; i < nextId; i++) {
            tournamentPromises.push(contractAPI.getTournament(i));
          }
          
          const tournamentResults = await Promise.all(tournamentPromises);
          console.log('📋 Tournament results:', tournamentResults);
          
          const validTournaments: Tournament[] = tournamentResults
            .filter(result => result !== null && result.value && result.value.value)
            .map((result, index) => {
              const tournament = result.value.value; // Tournament is wrapped in optional, so we need .value.value
              return {
                id: (index + 1).toString(),
                creator: tournament.creator?.value || 'Unknown',
                status: tournament.status?.value || 'pending',
                minEntryPrice: Number(tournament['min-entry-price']?.value || 0) / 1000000, // Convert from microSTX
                poolContribution: Number(tournament['pool-contribution']?.value || 0) / 1000000,
                targetPool: Number(tournament['target-pool']?.value || 0) / 1000000,
                currentPool: Number(tournament['current-pool']?.value || 0) / 1000000,
                participantCount: Number(tournament['participant-count']?.value || 0),
                duration: Number(tournament.duration?.value || 0),
                startBlock: tournament['start-block']?.value ? Number(tournament['start-block'].value) : undefined,
                endBlock: tournament['end-block']?.value ? Number(tournament['end-block'].value) : undefined,
                createdAt: tournament['created-at']?.value ? Number(tournament['created-at'].value) : Date.now(),
              };
            });
          
          console.log('✅ Processed tournaments:', validTournaments);
          setTournaments(validTournaments);
        } else {
          // No tournaments exist yet
          console.log('📭 No tournaments found');
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
    await fetchTournaments();
  };

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
        // Wait a bit for the transaction to be mined, then refresh
        console.log('🎉 Tournament created successfully! Refreshing in 3 seconds...');
        setTimeout(async () => {
          await refreshTournaments();
        }, 3000);
        
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
        // Mark participation in localStorage for the current user
        if (walletAddress) {
          const participationKey = `tournament_${tournamentId}_${walletAddress}`;
          localStorage.setItem(participationKey, 'true');
          console.log(`✅ Marked participation for tournament ${tournamentId}, user ${walletAddress}`);
        }
        
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

  const checkUserParticipation = async (tournamentId: string, userAddress: string) => {
    // Simple check: if user has participated, we'll track it in localStorage
    // This is a workaround for CORS issues with the API
    try {
      const participationKey = `tournament_${tournamentId}_${userAddress}`;
      const hasParticipated = localStorage.getItem(participationKey) === 'true';
      console.log(`🔍 Checking participation for tournament ${tournamentId}, user ${userAddress}: ${hasParticipated}`);
      return hasParticipated;
    } catch (error) {
      console.error('Error checking user participation:', error);
      return false;
    }
  };

  const markParticipation = (tournamentId: string, userAddress: string) => {
    const participationKey = `tournament_${tournamentId}_${userAddress}`;
    localStorage.setItem(participationKey, 'true');
    console.log(`✅ Manually marked participation for tournament ${tournamentId}, user ${userAddress}`);
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
    refreshTournaments,
    checkUserParticipation,
    markParticipation,
  };
};
