import { Link } from 'react-router-dom';
import { MatrixBackground } from '@/components/MatrixBackground';
import { GlitchText } from '@/components/GlitchText';
import { NeonButton } from '@/components/ui/neon-button';
import { Zap, Trophy, Gamepad2, Rocket } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen relative scanlines overflow-hidden">
      <MatrixBackground />

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Title */}
          <div className="mb-8 animate-fade-in">
            <GlitchText as="h1" className="text-7xl md:text-9xl text-primary mb-4">
              MATRIX DASH
            </GlitchText>
            <div className="h-1 w-64 mx-auto bg-gradient-to-r from-transparent via-secondary to-transparent matrix-glow-green" />
          </div>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-accent font-mono mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            ENTER THE MATRIX. COMPETE. WIN STX.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card/30 backdrop-blur-sm border neon-border rounded-lg p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Trophy className="w-12 h-12 text-secondary mx-auto mb-4 matrix-glow-green" />
              <h3 className="text-xl font-bold text-secondary mb-2">HIGH STAKES</h3>
              <p className="text-sm text-muted-foreground">
                Compete in STX-powered tournaments with real prizes
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border neon-border rounded-lg p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Gamepad2 className="w-12 h-12 text-primary mx-auto mb-4 matrix-glow" />
              <h3 className="text-xl font-bold text-primary mb-2">FAST GAMEPLAY</h3>
              <p className="text-sm text-muted-foreground">
                Geometry Dash mechanics meets blockchain rewards
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border neon-border rounded-lg p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <Zap className="w-12 h-12 text-accent mx-auto mb-4 matrix-glow-cyan" />
              <h3 className="text-xl font-bold text-accent mb-2">INSTANT PAYOUTS</h3>
              <p className="text-sm text-muted-foreground">
                Smart contract-powered prize distribution
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link to="/tournaments">
              <NeonButton variant="secondary" size="xl" className="gap-3 w-64">
                <Rocket className="w-6 h-6" />
                JACK IN NOW
              </NeonButton>
            </Link>
            
            <Link to="/leaderboard">
              <NeonButton variant="outline" size="xl" className="gap-3 w-64">
                <Trophy className="w-6 h-6" />
                VIEW RANKINGS
              </NeonButton>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">156</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Tournaments</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">2.5K</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">STX Awarded</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">1.2K</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Players</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative z-10 py-24 px-4 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="max-w-6xl mx-auto">
          <GlitchText as="h2" className="text-5xl text-center text-secondary mb-16">
            HOW IT WORKS
          </GlitchText>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'CONNECT WALLET', desc: 'Link your Stacks wallet to enter the Matrix' },
              { num: '02', title: 'JOIN TOURNAMENT', desc: 'Choose a tournament and stake your entry fee' },
              { num: '03', title: 'PLAY & COMPETE', desc: 'Run, jump, survive. Get the highest score' },
              { num: '04', title: 'CLAIM REWARDS', desc: 'Top 10% split 80% of the prize pool' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-bold text-primary/20 mb-4">{step.num}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 py-24 px-4 text-center">
        <GlitchText as="h2" className="text-5xl text-primary mb-6">
          READY TO COMPETE?
        </GlitchText>
        <p className="text-xl text-muted-foreground mb-8 font-mono">
          The Matrix awaits. Jack in and prove your skills.
        </p>
        <Link to="/tournaments">
          <NeonButton variant="secondary" size="xl" className="gap-3 animate-pulse-glow">
            <Zap className="w-6 h-6" />
            START NOW
          </NeonButton>
        </Link>
      </div>
    </div>
  );
};

export default Index;
