import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HolographicCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'secondary' | 'cyan';
}

export const HolographicCard = ({ 
  children, 
  className,
  glowColor = 'primary'
}: HolographicCardProps) => {
  const glowClass = {
    primary: 'matrix-glow',
    secondary: 'matrix-glow-green',
    cyan: 'matrix-glow-cyan'
  }[glowColor];

  return (
    <div
      className={cn(
        "relative rounded-lg border neon-border bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-card/70 group scanlines",
        glowClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
