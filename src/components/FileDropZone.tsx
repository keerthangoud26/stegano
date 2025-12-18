import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, Video, Music, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { MediaType } from "@/lib/steganography";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  previewUrl: string | null;
  onClear: () => void;
  accept: string;
  mediaType: MediaType;
  fileInfo: string;
  maxChars: number;
}

const mediaIcons: Record<MediaType, React.ReactNode> = {
  image: <ImageIcon className="w-8 h-8" />,
  video: <Video className="w-8 h-8" />,
  audio: <Music className="w-8 h-8" />,
  text: <FileText className="w-8 h-8" />,
};

const mediaLabels: Record<MediaType, string> = {
  image: "PNG, JPG, WEBP supported",
  video: "MP4, WEBM supported",
  audio: "WAV format only",
  text: "TXT files supported",
};

const FileDropZone = ({ 
  onFileSelect, 
  file, 
  previewUrl, 
  onClear, 
  accept,
  mediaType,
  fileInfo,
  maxChars
}: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  return (
    <div className="relative h-full">
      {!file ? (
        <label
          className={cn(
            "flex flex-col items-center justify-center h-full cursor-pointer rounded-lg transition-all duration-300",
            "border-2 border-dashed",
            isDragging 
              ? "border-primary bg-primary/10 border-glow-cyan" 
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className={cn(
            "p-4 rounded-full mb-4 transition-all duration-300",
            isDragging ? "bg-primary/20" : "bg-muted"
          )}>
            <div className={cn(
              "transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}>
              {mediaIcons[mediaType]}
            </div>
          </div>
          
          <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {isDragging ? `Drop ${mediaType} Here` : `Select ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {mediaLabels[mediaType]}
          </p>
        </label>
      ) : (
        <div className="relative h-full flex flex-col">
          {/* Clear button */}
          <Button
            variant="danger"
            size="icon"
            className="absolute top-2 right-2 z-20 w-8 h-8"
            onClick={onClear}
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center p-4 bg-cyber-darker/50 rounded-lg overflow-hidden">
            {mediaType === 'image' && previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded border border-border"
              />
            )}
            {mediaType === 'video' && previewUrl && (
              <video
                src={previewUrl}
                className="max-w-full max-h-full object-contain rounded border border-border"
                muted
                controls
              />
            )}
            {mediaType === 'audio' && (
              <div className="flex flex-col items-center gap-4">
                <Music className="w-16 h-16 text-primary" />
                <span className="text-sm text-muted-foreground">Audio file loaded</span>
              </div>
            )}
            {mediaType === 'text' && (
              <div className="flex flex-col items-center gap-4">
                <FileText className="w-16 h-16 text-primary" />
                <span className="text-sm text-muted-foreground">Text file loaded</span>
              </div>
            )}
          </div>
          
          {/* File info */}
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-primary w-4 h-4">
                {mediaType === 'image' && <ImageIcon className="w-4 h-4" />}
                {mediaType === 'video' && <Video className="w-4 h-4" />}
                {mediaType === 'audio' && <Music className="w-4 h-4" />}
                {mediaType === 'text' && <FileText className="w-4 h-4" />}
              </div>
              <span className="text-sm font-mono truncate text-foreground">
                {file.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-1.5 bg-background/50 rounded">
                <span className="text-muted-foreground block">Info</span>
                <span className="text-primary font-bold">{fileInfo || 'N/A'}</span>
              </div>
              <div className="text-center p-1.5 bg-background/50 rounded">
                <span className="text-muted-foreground block">Capacity</span>
                <span className="text-secondary font-bold">{maxChars.toLocaleString()} chars</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
