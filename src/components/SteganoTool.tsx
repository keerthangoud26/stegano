import { useState, useCallback, useEffect } from "react";
import { Shield, Lock, Unlock, Download, Terminal, Zap, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import CyberCard from "./CyberCard";
import FileDropZone from "./FileDropZone";
import MessageInput from "./MessageInput";
import { encodeMessage, decodeMessage, getImageCapacity } from "@/lib/steganography";
import { toast } from "@/hooks/use-toast";

type Mode = "encode" | "decode";

const SteganoTool = () => {
  const [mode, setMode] = useState<Mode>("encode");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; maxChars: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setResultBlob(null);
    setDecodedMessage(null);
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Get image capacity
    try {
      const info = await getImageCapacity(selectedFile);
      setImageInfo(info);
    } catch (error) {
      console.error("Failed to get image info:", error);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setImageInfo(null);
    setResultBlob(null);
    setDecodedMessage(null);
  }, [previewUrl]);

  const handleEncode = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select an image first", variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({ title: "Error", description: "Please enter a secret message", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Error", description: "Please enter an encryption key", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const blob = await encodeMessage(file, message, password);
      setResultBlob(blob);
      toast({ 
        title: "Success", 
        description: "Message encrypted and hidden! Click Download to save.",
      });
    } catch (error) {
      toast({ 
        title: "Encoding Failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecode = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select an image first", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Error", description: "Please enter the decryption key", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const decoded = await decodeMessage(file, password);
      setDecodedMessage(decoded);
      setMessage(decoded);
      toast({ 
        title: "Decryption Successful", 
        description: "Hidden message revealed!",
      });
    } catch (error) {
      toast({ 
        title: "Decryption Failed", 
        description: error instanceof Error ? error.message : "Invalid key or no hidden data",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stego_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded", description: "Steganographic image saved!" });
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-cyber-gradient relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 py-6 px-4 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-10 h-10 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/30 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-glow-cyan tracking-wider">
                STEGANO<span className="text-secondary">CRYPT</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono tracking-widest">
                SECURE STEGANOGRAPHY TOOLKIT v2.0
              </p>
            </div>
          </div>
          
          {/* Mode toggle */}
          <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg border border-border">
            <Button
              variant={mode === "encode" ? "encode" : "ghost"}
              size="sm"
              onClick={() => setMode("encode")}
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Encode</span>
            </Button>
            <Button
              variant={mode === "decode" ? "decode" : "ghost"}
              size="sm"
              onClick={() => setMode("decode")}
              className="gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span className="hidden sm:inline">Decode</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        {/* Info banner */}
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/30 flex items-start gap-3">
          <Terminal className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              {mode === "encode" 
                ? "Hide encrypted messages within images using LSB steganography. The resulting image looks identical to the original."
                : "Extract and decrypt hidden messages from steganographic images. Requires the correct decryption key."
              }
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left panel - Image */}
          <CyberCard title="Image Carrier" variant="glow" className="h-[450px]">
            <div className="p-4 h-[calc(100%-40px)]">
              <FileDropZone
                onFileSelect={handleFileSelect}
                file={file}
                previewUrl={previewUrl}
                onClear={handleClear}
                imageInfo={imageInfo}
              />
            </div>
          </CyberCard>

          {/* Right panel - Message */}
          <CyberCard 
            title={mode === "encode" ? "Secret Payload" : "Decrypted Output"} 
            variant="terminal" 
            className="h-[450px]"
          >
            <div className="p-4 h-[calc(100%-40px)]">
              <MessageInput
                message={message}
                setMessage={setMessage}
                password={password}
                setPassword={setPassword}
                maxChars={mode === "encode" ? imageInfo?.maxChars : undefined}
              />
            </div>
          </CyberCard>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          {mode === "encode" ? (
            <>
              <Button
                variant="encode"
                size="xl"
                onClick={handleEncode}
                disabled={isProcessing || !file || !message || !password}
                className="w-full sm:w-auto gap-2"
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-5 h-5 animate-pulse" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Hide & Encrypt
                  </>
                )}
              </Button>
              
              {resultBlob && (
                <Button
                  variant="cyber"
                  size="xl"
                  onClick={handleDownload}
                  className="w-full sm:w-auto gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Result
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="decode"
              size="xl"
              onClick={handleDecode}
              disabled={isProcessing || !file || !password}
              className="w-full sm:w-auto gap-2"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-5 h-5 animate-pulse" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Decrypt & Reveal
                </>
              )}
            </Button>
          )}
        </div>

        {/* Result display for decode mode */}
        {mode === "decode" && decodedMessage && (
          <CyberCard variant="glow" className="mt-6">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="font-display text-sm uppercase tracking-wider text-secondary">
                  Decrypted Message
                </span>
              </div>
              <div className="p-4 bg-background/50 rounded-lg border border-secondary/30">
                <p className="font-mono text-sm whitespace-pre-wrap text-foreground">
                  {decodedMessage}
                </p>
              </div>
            </div>
          </CyberCard>
        )}

        {/* Security notice */}
        <div className="mt-8 p-4 rounded-lg bg-muted/20 border border-border/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-neon-purple flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-display uppercase tracking-wider mb-1 text-foreground/80">Security Notice</p>
            <p>
              All encryption happens locally in your browser. No data is sent to any server. 
              Use PNG format for lossless encoding. JPEG compression may corrupt hidden data.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-4 mt-8 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span className="font-mono">STEGANOCRYPT // LSB STEGANOGRAPHY + XOR ENCRYPTION</span>
        </div>
      </footer>

      {/* Background circuit pattern */}
      <div className="fixed inset-0 circuit-pattern opacity-20 pointer-events-none" />
      
      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-r from-cyber-darker via-transparent to-cyber-darker pointer-events-none" />
    </div>
  );
};

export default SteganoTool;
