import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

export const GlitchText = ({ children, className, as: Component = 'span' }: GlitchTextProps) => {
  return (
    <Component
      className={cn("glitch font-display relative inline-block", className)}
      data-text={children}
    >
      {children}
    </Component>
  );
};
