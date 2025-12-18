import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glow" | "terminal";
  title?: string;
}

const CyberCard = ({ children, className, variant = "default", title }: CyberCardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden",
        variant === "default" && "bg-card border-2 border-border",
        variant === "glow" && "bg-card border-2 border-primary border-glow-cyan",
        variant === "terminal" && "bg-cyber-darker border-2 border-neon-green/50",
        className
      )}
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary" />
      
      {/* Title bar */}
      {title && (
        <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-neon-red/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-neon-green/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan/80" />
          </div>
          <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 animate-scan opacity-50" />
      </div>
    </div>
  );
};

export default CyberCard;
