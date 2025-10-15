import { useState } from 'react';
import { HolographicCard } from './HolographicCard';
import { GlitchText } from './GlitchText';
import { NeonButton } from './ui/neon-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTournaments } from '@/hooks/useTournaments';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

export const CreateTournamentForm = () => {
  const { createTournament } = useTournaments();
  const { isConnected, walletAddress, stxBalance } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    minEntryPrice: 1,
    poolContribution: 5,
    targetPool: 10,
    duration: 1008,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your Leather wallet first');
      return;
    }
    
    if (formData.poolContribution < 5) {
      toast.error('Pool contribution must be ≥ 5 STX');
      return;
    }
    
    if (formData.targetPool < 10) {
      toast.error('Target pool must be ≥ 10 STX');
      return;
    }

    // Check if wallet has sufficient balance (pool contribution + estimated fees)
    const requiredBalance = formData.poolContribution + 0.1; // Add 0.1 STX for transaction fees
    if (stxBalance < requiredBalance) {
      toast.error(`Insufficient balance. You need at least ${requiredBalance} STX (${formData.poolContribution} STX contribution + ~0.1 STX fees)`, {
        description: `Current balance: ${stxBalance} STX`,
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const result = await createTournament(formData);
      
      if (result.success) {
        toast.success(`Tournament created successfully! 🎮`, {
          description: 'Transaction submitted to blockchain',
        });
        // Reset form
        setFormData({
          minEntryPrice: 1,
          poolContribution: 5,
          targetPool: 10,
          duration: 1008,
        });
      } else {
        toast.error('Failed to create tournament', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error: any) {
      console.error('Tournament creation error:', error);
      toast.error('Failed to create tournament', {
        description: error.message || 'Unknown error occurred',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const estimatedTime = Math.floor(formData.duration / 144);
  const remainingNeeded = formData.targetPool - formData.poolContribution;

  return (
    <HolographicCard glowColor="secondary" className="mb-8">
      <GlitchText as="h2" className="text-3xl mb-6 text-secondary">
        Initialize New Tournament Matrix
      </GlitchText>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="minEntryPrice" className="text-primary mb-2 block">
              MIN_ENTRY_PRICE
            </Label>
            <Input
              id="minEntryPrice"
              type="number"
              step="0.1"
              min="1"
              value={formData.minEntryPrice}
              onChange={(e) => setFormData({ ...formData, minEntryPrice: parseFloat(e.target.value) || 0 })}
              className="terminal-input"
            />
            <p className="text-xs text-muted-foreground mt-1">≥ 1 STX</p>
          </div>

          <div>
            <Label htmlFor="poolContribution" className="text-primary mb-2 block">
              POOL_CONTRIBUTION
            </Label>
            <Input
              id="poolContribution"
              type="number"
              step="1"
              min="5"
              value={formData.poolContribution}
              onChange={(e) => setFormData({ ...formData, poolContribution: parseFloat(e.target.value) || 0 })}
              className="terminal-input"
            />
            <p className="text-xs text-muted-foreground mt-1">≥ 5 STX</p>
          </div>

          <div>
            <Label htmlFor="targetPool" className="text-primary mb-2 block">
              TARGET_POOL
            </Label>
            <Input
              id="targetPool"
              type="number"
              step="1"
              min="10"
              value={formData.targetPool}
              onChange={(e) => setFormData({ ...formData, targetPool: parseFloat(e.target.value) || 0 })}
              className="terminal-input"
            />
            <p className="text-xs text-muted-foreground mt-1">≥ 10 STX</p>
          </div>

          <div>
            <Label htmlFor="duration" className="text-primary mb-2 block">
              DURATION (blocks)
            </Label>
            <Input
              id="duration"
              type="number"
              step="144"
              min="144"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="terminal-input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ~{estimatedTime} days
            </p>
          </div>
        </div>

        {/* Visual Calculator */}
        <div className="bg-muted/20 rounded-lg p-4 space-y-2 border border-primary/30">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wallet balance:</span>
            <span className="font-bold text-secondary">{stxBalance} STX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your contribution:</span>
            <span className="font-bold text-primary">{formData.poolContribution} STX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Minimum to start:</span>
            <span className="font-bold text-secondary">{formData.targetPool} STX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining needed:</span>
            <span className="font-bold text-primary">{remainingNeeded} STX</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-3">
            <div
              className="bg-secondary h-2 rounded-full transition-all duration-300 matrix-glow-green"
              style={{ width: `${(formData.poolContribution / formData.targetPool) * 100}%` }}
            />
          </div>
        </div>

        <NeonButton
          type="submit"
          variant="default"
          size="xl"
          className="w-full gap-2"
          disabled={isCreating || !isConnected}
        >
          {!isConnected 
            ? 'CONNECT WALLET TO DEPLOY' 
            : isCreating 
            ? 'DEPLOYING...' 
            : 'DEPLOY TOURNAMENT'
          }
        </NeonButton>
      </form>
    </HolographicCard>
  );
};
