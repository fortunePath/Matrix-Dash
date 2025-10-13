import { useState } from 'react';
import { MatrixBackground } from '@/components/MatrixBackground';
import { WalletConnect } from '@/components/WalletConnect';
import { CreateTournamentForm } from '@/components/CreateTournamentForm';
import { TournamentCard } from '@/components/TournamentCard';
import { EntryModal } from '@/components/EntryModal';
import { GlitchText } from '@/components/GlitchText';
import { useTournaments } from '@/hooks/useTournaments';
import { useWallet } from '@/hooks/useWallet';
import { Tournament } from '@/hooks/useTournaments';
import { Link } from 'react-router-dom';
import { NeonButton } from '@/components/ui/neon-button';
import { Filter, Trophy, Gamepad2 } from 'lucide-react';

const Tournaments = () => {
  const { tournaments, loading, enterTournament } = useTournaments();
  const { stxBalance } = useWallet();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | Tournament['status']>('all');

  const filteredTournaments = tournaments.filter(t => 
    statusFilter === 'all' ? true : t.status === statusFilter
  );

  const handleEnterClick = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      setSelectedTournament(tournament);
    }
  };

  return (
    <div className="min-h-screen relative scanlines">
      <MatrixBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-primary/30 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <GlitchText as="h1" className="text-2xl text-primary">
                MATRIX DASH
              </GlitchText>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/tournaments" className="text-primary font-bold border-b-2 border-primary pb-1">
                  TOURNAMENTS
                </Link>
                <Link to="/play" className="text-muted-foreground hover:text-accent transition-colors">
                  PLAY
                </Link>
                <Link to="/leaderboard" className="text-muted-foreground hover:text-accent transition-colors">
                  LEADERBOARD
                </Link>
              </nav>
            </div>

            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Create Tournament Section */}
        <CreateTournamentForm />

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-accent">
            <Filter className="w-5 h-5" />
            <span className="font-bold">FILTER:</span>
          </div>
          
          {['all', 'pending', 'active', 'ended'].map((status) => (
            <NeonButton
              key={status}
              variant={statusFilter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status as any)}
            >
              {status.toUpperCase()}
            </NeonButton>
          ))}
        </div>

        {/* Active Tournaments */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-secondary" />
            <GlitchText as="h2" className="text-3xl text-secondary">
              Active Tournament Matrix
            </GlitchText>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent matrix-glow" />
              <p className="mt-4 text-muted-foreground">Loading tournaments...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-20 bg-card/30 rounded-lg border neon-border">
              <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-2">No tournaments found</p>
              <p className="text-sm text-muted-foreground">Create one above or change filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <div key={tournament.id} className="animate-fade-in">
                  <TournamentCard
                    tournament={tournament}
                    onEnter={handleEnterClick}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Entry Modal */}
      {selectedTournament && (
        <EntryModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          onEnter={enterTournament}
          walletBalance={stxBalance}
        />
      )}
    </div>
  );
};

export default Tournaments;
