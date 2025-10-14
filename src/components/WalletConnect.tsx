import { Wallet, LogOut, ExternalLink } from 'lucide-react';
import { NeonButton } from './ui/neon-button';
import { useWallet } from '@/contexts/WalletContext';
import { useState } from 'react';

export const WalletConnect = () => {
  const { isConnected, walletAddress, stxBalance, isLeatherInstalled, connectWallet, disconnectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    const result = await connectWallet();
    if (!result.success && result.error) {
      alert(result.error);
    }
    setIsConnecting(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isLeatherInstalled) {
    return (
      <div className="flex flex-col gap-2">
        <NeonButton
          onClick={() => window.open('https://leather.io/', '_blank')}
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Install Leather Wallet
        </NeonButton>
        <p className="text-xs text-muted-foreground text-center">
          Leather wallet required to play
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <NeonButton
        onClick={handleConnect}
        disabled={isConnecting}
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect Leather Wallet'}
      </NeonButton>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm text-muted-foreground">Balance</div>
        <div className="text-lg font-bold text-primary">
          {stxBalance.toFixed(2)} STX
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-muted-foreground">Address</div>
        <div className="text-sm font-mono text-primary">
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
