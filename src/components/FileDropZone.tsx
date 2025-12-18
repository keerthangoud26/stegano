import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  previewUrl: string | null;
  onClear: () => void;
  imageInfo?: { width: number; height: number; maxChars: number } | null;
}

const FileDropZone = ({ onFileSelect, file, previewUrl, onClear, imageInfo }: FileDropZoneProps) => {
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
    if (droppedFile && droppedFile.type.startsWith('image/')) {
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
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className={cn(
            "p-4 rounded-full mb-4 transition-all duration-300",
            isDragging ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {isDragging ? "Drop Image Here" : "Select Image"}
          </p>
          <p className="text-xs text-muted-foreground/70">
            PNG, JPG, WEBP supported
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
          
          {/* Image preview */}
          <div className="flex-1 flex items-center justify-center p-4 bg-cyber-darker/50 rounded-lg overflow-hidden">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded border border-border"
              />
            )}
          </div>
          
          {/* File info */}
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono truncate text-foreground">
                {file.name}
              </span>
            </div>
            {imageInfo && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-1.5 bg-background/50 rounded">
                  <span className="text-muted-foreground block">Width</span>
                  <span className="text-primary font-bold">{imageInfo.width}px</span>
                </div>
                <div className="text-center p-1.5 bg-background/50 rounded">
                  <span className="text-muted-foreground block">Height</span>
                  <span className="text-primary font-bold">{imageInfo.height}px</span>
                </div>
                <div className="text-center p-1.5 bg-background/50 rounded">
                  <span className="text-muted-foreground block">Capacity</span>
                  <span className="text-secondary font-bold">{imageInfo.maxChars.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
