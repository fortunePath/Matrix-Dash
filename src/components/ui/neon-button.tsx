import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-mono font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 matrix-glow hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 matrix-glow-green hover:shadow-[0_0_30px_hsl(var(--secondary)/0.8)]",
        outline:
          "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground matrix-glow",
        ghost:
          "text-primary hover:bg-primary/10 hover:text-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_10px_hsl(var(--destructive)/0.5)]",
        success:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 matrix-glow-green",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 shadow-[0_0_10px_hsl(var(--warning)/0.5)]",
      },
      size: {
        default: "h-10 px-6 py-2 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
  asChild?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(neonButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </Comp>
    );
  }
);
NeonButton.displayName = "NeonButton";

export { NeonButton, neonButtonVariants };
