import { useWallet } from './useWallet';
import { contract } from '@/lib/contract';

export const useContract = () => {
  const { callContract, isConnected } = useWallet();

  const createTournament = async (
    minEntryPrice: number,
    poolContribution: number,
    targetPool: number,
    duration: number
  ) => {
    if (!isConnected) throw new Error('Wallet not connected');

    console.log('Creating tournament:', { minEntryPrice, poolContribution, targetPool, duration });

    return callContract(
      'create-tournament',
      [minEntryPrice, poolContribution, targetPool, duration],
      contract.principal,
      contract.name
    );
  };

  const enterTournament = async (tournamentId: number, entryAmount: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    console.log('Entering tournament:', { tournamentId, entryAmount });

    return callContract(
      'enter-tournament',
      [tournamentId, entryAmount],
      contract.principal,
      contract.name
    );
  };

  const submitScore = async (tournamentId: number, score: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    console.log('Submitting score:', { tournamentId, score });

    return callContract(
      'submit-score',
      [tournamentId, score],
      contract.principal,
      contract.name
    );
  };

  const endTournament = async (tournamentId: number) => {
    if (!isConnected) throw new Error('Wallet not connected');

    console.log('Ending tournament:', tournamentId);

    return callContract(
      'end-tournament',
      [tournamentId],
      contract.principal,
      contract.name
    );
  };

  const distributePrizes = async (tournamentId: number, winners: string[]) => {
    if (!isConnected) throw new Error('Wallet not connected');

    console.log('Distributing prizes:', { tournamentId, winners });

    return callContract(
      'distribute-prizes',
      [tournamentId, winners],
      contract.principal,
      contract.name
    );
  };

  return {
    createTournament,
    enterTournament,
    submitScore,
    endTournament,
    distributePrizes,
  };
};