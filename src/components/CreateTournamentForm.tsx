import { useState } from 'react';
import { HolographicCard } from './HolographicCard';
import { GlitchText } from './GlitchText';
import { NeonButton } from './ui/neon-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Rocket } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { toast } from 'sonner';

export const CreateTournamentForm = () => {
  const { createTournament } = useTournaments();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    minEntryPrice: 1,
    poolContribution: 5,
    targetPool: 10,
    duration: 1008,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.poolContribution < 5) {
      toast.error('Pool contribution must be ≥ 5 STX');
      return;
    }
    
    if (formData.targetPool < 10) {
      toast.error('Target pool must be ≥ 10 STX');
      return;
    }

    setIsCreating(true);
    const result = await createTournament(formData);
    setIsCreating(false);

    if (result.success) {
      toast.success(`Tournament ${result.tournamentId} created! 🎮`, {
        description: 'Waiting for runners to jack in...',
      });
    } else {
      toast.error('Failed to create tournament');
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
              onChange={(e) => setFormData({ ...formData, minEntryPrice: parseFloat(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, poolContribution: parseFloat(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, targetPool: parseFloat(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
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
          disabled={isCreating}
        >
          {isCreating ? 'DEPLOYING...' : 'DEPLOY TOURNAMENT'}
        </NeonButton>
      </form>
    </HolographicCard>
  );
};
