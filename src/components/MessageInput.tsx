import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  message: string;
  setMessage: (msg: string) => void;
  password: string;
  setPassword: (pwd: string) => void;
  maxChars?: number;
}

const MessageInput = ({ message, setMessage, password, setPassword, maxChars }: MessageInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const charCount = message.length;
  const isOverLimit = maxChars ? charCount > maxChars : false;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Message textarea */}
      <div className="flex-1 flex flex-col">
        <label className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Secret Message
        </label>
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your secret message here..."
            className={cn(
              "w-full h-full p-4 rounded-lg resize-none font-mono text-sm",
              "bg-input border-2 border-border",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:border-primary focus:border-glow-cyan",
              "transition-all duration-300",
              isOverLimit && "border-destructive focus:border-destructive"
            )}
          />
          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 animate-scan opacity-30" />
          </div>
        </div>
        
        {/* Character count */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className="text-muted-foreground font-mono">
            Characters: <span className={isOverLimit ? "text-destructive" : "text-primary"}>{charCount.toLocaleString()}</span>
            {maxChars && <span className="text-muted-foreground/70"> / {maxChars.toLocaleString()}</span>}
          </span>
          {isOverLimit && (
            <span className="text-destructive animate-pulse">Message exceeds capacity!</span>
          )}
        </div>
      </div>

      {/* Password input */}
      <div>
        <label className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
          <Lock className="w-3 h-3" />
          Encryption Key
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter secret key..."
            className={cn(
              "w-full p-3 pr-12 rounded-lg font-mono text-sm",
              "bg-input border-2 border-border",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:border-neon-purple focus:shadow-[0_0_20px_hsl(var(--neon-purple)/0.3)]",
              "transition-all duration-300"
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-1.5">
          This key encrypts your message. Keep it secret!
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
