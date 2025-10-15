import { useWallet } from '@/contexts/WalletContext';
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

  const submitScore = async (tournamentId: number, score: number, gameSessionHash: string, signature: string) => {
    if (!isConnected) throw new Error('Wallet not connected');

    console.log('Submitting score with proof:', { tournamentId, score, gameSessionHash, signature });

    // Convert hex strings to buffers for Clarity contract
    const gameSessionHashBuffer = `0x${gameSessionHash}`;
    const signatureBuffer = `0x${signature}`;

    return callContract(
      'submit-score',
      [tournamentId, score, gameSessionHashBuffer, signatureBuffer],
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