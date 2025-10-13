import { useState, useEffect } from 'react';

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

// Mock data for development
const mockTournaments: Tournament[] = [
  {
    id: 'TRN_001',
    creator: 'SP2J6...ABCD',
    status: 'active',
    minEntryPrice: 1,
    poolContribution: 5,
    targetPool: 10,
    currentPool: 25,
    participantCount: 12,
    duration: 1008,
    startBlock: 100000,
    endBlock: 101008,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'TRN_002',
    creator: 'SP3K9...WXYZ',
    status: 'pending',
    minEntryPrice: 2,
    poolContribution: 10,
    targetPool: 20,
    currentPool: 12,
    participantCount: 4,
    duration: 1008,
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'TRN_003',
    creator: 'SP1A2...EFGH',
    status: 'active',
    minEntryPrice: 0.5,
    poolContribution: 3,
    targetPool: 5,
    currentPool: 8,
    participantCount: 12,
    duration: 504,
    startBlock: 99500,
    endBlock: 100004,
    createdAt: Date.now() - 172800000,
  },
];

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual Stacks.js blockchain call
        await new Promise(resolve => setTimeout(resolve, 500));
        setTournaments(mockTournaments);
        setError(null);
      } catch (err) {
        setError('Failed to fetch tournaments');
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
      // TODO: Call Clarity contract create-tournament
      console.log('Creating tournament:', params);
      
      const newTournament: Tournament = {
        id: `TRN_${String(tournaments.length + 1).padStart(3, '0')}`,
        creator: 'SP_USER...1234',
        status: 'pending',
        ...params,
        currentPool: params.poolContribution,
        participantCount: 1,
        createdAt: Date.now(),
      };

      setTournaments(prev => [newTournament, ...prev]);
      return { success: true, tournamentId: newTournament.id };
    } catch (err) {
      return { success: false, error: 'Failed to create tournament' };
    }
  };

  const enterTournament = async (tournamentId: string, entryAmount: number) => {
    try {
      // TODO: Call Clarity contract enter-tournament
      console.log('Entering tournament:', tournamentId, entryAmount);

      setTournaments(prev => prev.map(t => {
        if (t.id === tournamentId) {
          const newPool = t.currentPool + entryAmount;
          const newStatus = newPool >= t.targetPool ? 'active' : t.status;
          return {
            ...t,
            currentPool: newPool,
            participantCount: t.participantCount + 1,
            status: newStatus,
            ...(newStatus === 'active' && !t.startBlock ? {
              startBlock: 100000,
              endBlock: 100000 + t.duration,
            } : {}),
          };
        }
        return t;
      }));

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to enter tournament' };
    }
  };

  const getTournamentById = (id: string) => {
    return tournaments.find(t => t.id === id);
  };

  return {
    tournaments,
    loading,
    error,
    createTournament,
    enterTournament,
    getTournamentById,
  };
};
