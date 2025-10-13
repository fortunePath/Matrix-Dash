import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HolographicCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'secondary' | 'orange';
}

export const HolographicCard = ({ 
  children, 
  className,
  glowColor = 'primary'
}: HolographicCardProps) => {
  const glowClass = {
    primary: 'matrix-glow',
    secondary: 'matrix-glow-green',
    orange: 'matrix-glow-orange'
  }[glowColor];

  return (
    <div
      className={cn(
        "relative rounded-lg border neon-border bg-card/50 backdrop-blur-sm p-6 group scanlines",
        glowClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
