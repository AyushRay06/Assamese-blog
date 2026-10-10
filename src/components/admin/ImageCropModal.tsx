"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  RefreshCw,
  Check,
  X,
  ImageIcon,
  Maximize2,
  Move,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

export type AspectRatioOption = "16:9" | "21:9" | "4:3" | "1:1" | "free";

interface AspectPreset {
  id: AspectRatioOption;
  label: string;
  ratio: number | null; // width / height
  description: string;
  recommendedSize: string;
}

const PRESETS: AspectPreset[] = [
  {
    id: "16:9",
    label: "16:9 (Blog Cover)",
    ratio: 16 / 9,
    description: "Standard frame for blog cards and social sharing",
    recommendedSize: "1200 × 675 px",
  },
  {
    id: "21:9",
    label: "21:9 (Hero Banner)",
    ratio: 21 / 9,
    description: "Cinematic ultra-wide header banner",
    recommendedSize: "1260 × 540 px",
  },
  {
    id: "4:3",
    label: "4:3 (Editorial)",
    ratio: 4 / 3,
    description: "Classic magazine and editorial layout",
    recommendedSize: "1200 × 900 px",
  },
  {
    id: "1:1",
    label: "1:1 (Square)",
    ratio: 1,
    description: "Square frame for avatars or symmetrical cards",
    recommendedSize: "800 × 800 px",
  },
  {
    id: "free",
    label: "Freeform",
    ratio: null,
    description: "Custom unconstrained framing",
    recommendedSize: "Flexible",
  },
];

export interface CropResult {
  blob: Blob;
  dataUrl: string;
  file: File;
}

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  filename?: string;
  initialAspectRatio?: AspectRatioOption;
  title?: string;
  onCropComplete: (result: CropResult) => Promise<void> | void;
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  filename = "cropped-image.webp",
  initialAspectRatio = "16:9",
  title = "Crop & Frame Image",
  onCropComplete,
}: ImageCropModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<AspectRatioOption>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);

  // Reset transforms whenever a new image or preset is opened
  useEffect(() => {
    if (open) {
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setOffset({ x: 0, y: 0 });
      setSelectedPreset(initialAspectRatio);
    }
  }, [open, initialAspectRatio, imageSrc]);

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imageRef.current = img;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setImageLoaded(true);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Zoom controls
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.6, Math.min(3.5, newZoom)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoomChange(zoom + delta);
  };

  // Pointer drag to pan image
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setOffset({
      x: dragStartRef.current.startX + dx,
      y: dragStartRef.current.startY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Flip horizontal
  const handleFlipHorizontal = () => {
    setFlipH((prev) => !prev);
  };

  // Reset to initial
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffset({ x: 0, y: 0 });
    toast.info("Image frame reset to default");
  };

  const currentPreset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  // Helper to render and export cropped canvas to WebP Blob
  const drawAndExport = (
    imageElement: HTMLImageElement,
    exportWidth: number,
    exportHeight: number,
    frameWidth: number,
    onScreenWidth: number,
    onScreenHeight: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = exportWidth;
        canvas.height = exportHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Canvas context initialization failed"));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Translate to canvas center
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Apply horizontal flip
        ctx.scale(flipH ? -1 : 1, 1);

        // Scale factor between screen frame and high-res export canvas
        const scaleMultiplier = exportWidth / frameWidth;

        // Draw image with current pan offset and zoom
        const drawWidth = onScreenWidth * zoom * scaleMultiplier;
        const drawHeight = onScreenHeight * zoom * scaleMultiplier;
        const drawX = offset.x * scaleMultiplier - drawWidth / 2;
        const drawY = offset.y * scaleMultiplier - drawHeight / 2;

        ctx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas export returned empty"));
            }
          },
          "image/webp",
          0.88
        );
      } catch (err) {
        reject(err);
      }
    });
  };

  // Perform canvas cropping and export
  const handleApplyCrop = async () => {
    if (!imageRef.current) return;

    try {
      setIsProcessing(true);
      const img = imageRef.current;
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const frameWidth = containerRect.width;
      const frameHeight = containerRect.height;

      // Desired output canvas resolution (high DPI up to 1600px width)
      const exportWidth = 1600;
      const exportHeight = currentPreset.ratio
        ? Math.round(exportWidth / currentPreset.ratio)
        : Math.round(exportWidth * (frameHeight / frameWidth));

      const onScreenWidth = img.clientWidth;
      const onScreenHeight = img.clientHeight;

      let blob: Blob;

      try {
        // Fast path: direct instant export
        blob = await drawAndExport(img, exportWidth, exportHeight, frameWidth, onScreenWidth, onScreenHeight);
      } catch (taintErr) {
        // If direct export hits CORS / tainted canvas, load through public proxy on demand
        console.warn("Direct export tainted, using fast proxy fallback:", taintErr);
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
        const proxiedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const pImg = new window.Image();
          pImg.crossOrigin = "anonymous";
          pImg.onload = () => resolve(pImg);
          pImg.onerror = () => reject(new Error("Failed to load proxied image"));
          pImg.src = proxyUrl;
        });

        blob = await drawAndExport(proxiedImg, exportWidth, exportHeight, frameWidth, onScreenWidth, onScreenHeight);
      }

      const cleanName = filename.replace(/\.[^/.]+$/, "") + ".webp";
      const file = new File([blob], cleanName, {
        type: "image/webp",
        lastModified: Date.now(),
      });

      const dataUrl = URL.createObjectURL(blob);

      await onCropComplete({ blob, dataUrl, file });
      toast.success("Image framed and cropped successfully!");
      onOpenChange(false);
    } catch (err) {
      console.error("Crop export error:", err);
      toast.error("Error cropping image: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-card-foreground animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Crop className="h-4 w-4" />
            </div>
            <div>
              <h3 id="crop-modal-title" className="font-heading text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adjust frame, pan, and zoom to select the exact visual area.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Info Bar: Frame Dimensions & Aspect Ratio Presets */}
        <div className="px-5 py-3 border-b border-border/40 bg-muted/10 shrink-0 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Allowed Frame:</span>
              <Badge variant="secondary" className="text-xs font-mono px-2 py-0.5">
                {currentPreset.label}
              </Badge>
              <span className="text-[11px] font-mono text-muted-foreground">
                ({currentPreset.recommendedSize})
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3 w-3 text-primary shrink-0" />
              <span>{currentPreset.description}</span>
            </div>
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.id);
                  setOffset({ x: 0, y: 0 });
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono transition-all border",
                  selectedPreset === preset.id
                    ? "bg-foreground text-background font-semibold border-foreground shadow-xs"
                    : "bg-muted/30 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/60"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Cropping Canvas Viewport */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-neutral-950 flex flex-col items-center justify-center relative min-h-[300px] sm:min-h-[420px]">
          {/* Framing Viewport Box */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              aspectRatio: currentPreset.ratio ? `${currentPreset.ratio}` : "16/9",
            }}
            className={cn(
              "relative w-full max-w-2xl max-h-[50vh] overflow-hidden border-2 border-white/80 rounded-xl shadow-2xl bg-black select-none cursor-grab active:cursor-grabbing",
              isDragging && "cursor-grabbing"
            )}
          >
            {/* Rule of thirds grid guidelines */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 z-20 opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Loading state while browser decodes initial image */}
            {!imageLoaded && !loadError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
            )}

            {/* Error state if image fails to load */}
            {loadError && (
              <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                <Info className="h-6 w-6 text-destructive" />
                <span className="text-xs font-mono">{loadError}</span>
              </div>
            )}

            {/* Draggable & Scalable Image */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Framing preview"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onLoad={handleImageLoad}
                onError={() => {
                  setImageLoaded(false);
                  setLoadError("Failed to load image preview. Please verify URL.");
                }}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                  transformOrigin: "center center",
                  maxHeight: "none",
                  maxWidth: "none",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="pointer-events-auto cursor-grab active:cursor-grabbing object-contain select-none"
                draggable={false}
              />
            </div>

            {/* Hint overlay */}
            <div className="pointer-events-none absolute bottom-2 right-2 z-20 bg-black/60 backdrop-blur-xs text-white/80 text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
              <Move className="h-2.5 w-2.5" />
              <span>Drag to Pan • Scroll to Zoom</span>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar: Zoom, Rotate, Flip, Reset */}
        <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2.5 flex-1 max-w-sm">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <input
                type="range"
                min="0.6"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />

              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <span className="text-xs font-mono font-medium text-foreground min-w-[42px] text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Tool buttons: Rotate, Flip, Reset */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="h-8 gap-1 text-xs font-mono"
                title="Rotate 90 degrees clockwise"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Rotate</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFlipHorizontal}
                className="h-8 gap-1 text-xs font-mono"
                title="Flip horizontally"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                <span>Flip</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1 text-xs font-mono text-muted-foreground"
                title="Reset zoom and position"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border/60 bg-muted/30 shrink-0">
          <div className="text-xs text-muted-foreground font-mono">
            {naturalSize.w > 0 && (
              <span>Original: {naturalSize.w} × {naturalSize.h} px</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => onOpenChange(false)}
              className="text-xs font-mono"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isProcessing || !imageLoaded}
              onClick={handleApplyCrop}
              className="text-xs font-mono gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Apply & Frame Image</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
