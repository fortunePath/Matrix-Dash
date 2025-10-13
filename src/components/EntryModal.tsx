import { useState } from 'react';
import { Tournament } from '@/hooks/useTournaments';
import { GlitchText } from './GlitchText';
import { NeonButton } from './ui/neon-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface EntryModalProps {
  tournament: Tournament;
  onClose: () => void;
  onEnter: (tournamentId: string, amount: number) => Promise<any>;
  walletBalance: number;
}

export const EntryModal = ({ tournament, onClose, onEnter, walletBalance }: EntryModalProps) => {
  const [entryAmount, setEntryAmount] = useState(tournament.minEntryPrice);
  const [isEntering, setIsEntering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entryAmount < tournament.minEntryPrice) {
      toast.error(`Minimum entry is ${tournament.minEntryPrice} STX`);
      return;
    }

    if (entryAmount > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsEntering(true);
    const result = await onEnter(tournament.id, entryAmount);
    setIsEntering(false);

    if (result.success) {
      toast.success('Successfully entered tournament! 🚀');
      onClose();
    } else {
      toast.error('Failed to enter tournament');
    }
  };

  const poolAfterEntry = tournament.currentPool + entryAmount;
  const progress = (poolAfterEntry / tournament.targetPool) * 100;
  const willStartTournament = poolAfterEntry >= tournament.targetPool && tournament.status === 'pending';
  const estimatedPrize = (poolAfterEntry * 0.8) / Math.ceil(tournament.participantCount * 0.1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm scanlines">
      <div className="relative w-full max-w-md animate-slide-in-right">
        <div className="bg-card/90 border-2 neon-border rounded-lg p-6 shadow-2xl matrix-glow">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <GlitchText as="h2" className="text-2xl mb-6 text-primary">
            Jack Into #{tournament.id}
          </GlitchText>

          {/* Tournament Info */}
          <div className="bg-muted/20 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Pool:</span>
              <span className="font-bold text-primary">{tournament.currentPool} STX</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target Pool:</span>
              <span className="font-bold text-secondary">{tournament.targetPool} STX</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participants:</span>
              <span className="font-bold text-accent">{tournament.participantCount}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="entryAmount" className="text-accent mb-2 block">
                ENTRY_AMOUNT
              </Label>
              <Input
                id="entryAmount"
                type="number"
                step="0.1"
                min={tournament.minEntryPrice}
                max={walletBalance}
                value={entryAmount}
                onChange={(e) => setEntryAmount(parseFloat(e.target.value))}
                className="terminal-input text-lg"
              />
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-muted-foreground">
                  Min: {tournament.minEntryPrice} STX
                </span>
                <span className="text-muted-foreground">
                  Max: {walletBalance} STX
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={tournament.minEntryPrice}
                max={walletBalance}
                step="0.1"
                value={entryAmount}
                onChange={(e) => setEntryAmount(parseFloat(e.target.value))}
                className="w-full mt-4 accent-primary"
              />
            </div>

            {/* Preview */}
            <div className="bg-muted/20 rounded-lg p-4 space-y-2 border border-primary/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your stake:</span>
                <span className="font-bold text-warning">{entryAmount} STX</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pool after entry:</span>
                <span className="font-bold text-primary">{poolAfterEntry.toFixed(2)} STX</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-bold text-secondary">{Math.min(progress, 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. prize (top 10%):</span>
                <span className="font-bold text-accent">{estimatedPrize.toFixed(2)} STX</span>
              </div>

              {willStartTournament && (
                <div className="mt-4 p-3 bg-secondary/20 rounded border border-secondary animate-pulse-glow">
                  <div className="flex items-center gap-2 text-secondary font-bold">
                    <Zap className="w-5 h-5" />
                    THIS WILL START THE TOURNAMENT
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <NeonButton
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={isEntering}
              >
                {isEntering ? 'ENTERING...' : 'ENTER TOURNAMENT'}
              </NeonButton>

              <NeonButton
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onClose}
              >
                CANCEL
              </NeonButton>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Gas fee: ~0.001 STX
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
