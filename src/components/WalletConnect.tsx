import { Wallet, LogOut } from 'lucide-react';
import { NeonButton } from './ui/neon-button';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';

export const WalletConnect = () => {
  const { isConnected, walletAddress, stxBalance, connectWallet, disconnectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWallet();
    setIsConnecting(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <NeonButton
        onClick={handleConnect}
        disabled={isConnecting}
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </NeonButton>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm text-muted-foreground">Balance</div>
        <div className="text-lg font-bold text-primary matrix-glow">
          {stxBalance.toFixed(2)} STX
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-muted-foreground">Address</div>
        <div className="text-sm font-mono text-accent">
          {truncateAddress(walletAddress!)}
        </div>
      </div>
      <NeonButton
        variant="ghost"
        size="icon"
        onClick={disconnectWallet}
        className="ml-2"
      >
        <LogOut className="w-4 h-4" />
      </NeonButton>
    </div>
  );
};
