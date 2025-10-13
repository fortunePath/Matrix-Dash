import { useState } from 'react';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stxBalance, setStxBalance] = useState(100); // Mock balance

  const connectWallet = async () => {
    try {
      // TODO: Integrate with Stacks.js wallet connection
      console.log('Connecting wallet...');
      
      // Mock connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
      setWalletAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');
      setStxBalance(100);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to connect wallet' };
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setStxBalance(0);
  };

  return {
    isConnected,
    walletAddress,
    stxBalance,
    connectWallet,
    disconnectWallet,
  };
};
