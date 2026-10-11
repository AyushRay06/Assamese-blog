"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  X,
  Move,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

export type AspectRatioOption = "16:9";

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
  initialAspectRatio?: AspectRatioOption | string;
  title?: string;
  onCropComplete: (result: CropResult) => Promise<void> | void;
}

export function ImageCropModal(props: ImageCropModalProps) {
  if (!props.open) return null;
  return (
    <ImageCropModalContent
      key={props.imageSrc}
      {...props}
    />
  );
}

function ImageCropModalContent({
  onOpenChange,
  imageSrc,
  filename = "cover-image.webp",
  title = "Crop Cover Image",
  onCropComplete,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);

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
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;
    setOffset({
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY + deltaY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
    }
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Draw and export framed 16:9 canvas
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
          reject(new Error("Unable to obtain 2D canvas context"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Translate to canvas center
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

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
          0.9
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

      // Output resolution locked strictly to 16:9 (1600 × 900 px)
      const exportWidth = 1600;
      const exportHeight = 900;

      const onScreenWidth = img.clientWidth;
      const onScreenHeight = img.clientHeight;

      let blob: Blob;

      try {
        // Direct canvas draw
        blob = await drawAndExport(img, exportWidth, exportHeight, frameWidth, onScreenWidth, onScreenHeight);
      } catch (taintErr) {
        // Fallback for CORS-protected remote URLs
        console.warn("Direct export tainted, using proxy fallback:", taintErr);
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
      toast.success("Cover image cropped to 16:9 successfully!");
      onOpenChange(false);
    } catch (err) {
      console.error("Crop export error:", err);
      toast.error("Error cropping image: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-card-foreground animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Crop className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="crop-modal-title" className="font-heading text-sm sm:text-base font-semibold text-foreground">
                  {title}
                </h3>
                <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
                  16:9 Format
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drag to reposition &bull; Scroll or use the slider below to zoom
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

        {/* 16:9 Viewport Canvas */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-neutral-950 flex flex-col items-center justify-center relative min-h-[280px] sm:min-h-[380px]">
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              aspectRatio: "16/9",
            }}
            className={cn(
              "relative w-full max-w-2xl max-h-[52vh] overflow-hidden border-2 border-white/80 rounded-xl shadow-2xl bg-black select-none cursor-grab active:cursor-grabbing",
              isDragging && "cursor-grabbing"
            )}
          >
            {/* Rule of thirds grid guidelines */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 z-20 opacity-25">
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

            {/* Loading state */}
            {!imageLoaded && !loadError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
            )}

            {/* Error state */}
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
                alt="16:9 Cover preview"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onLoad={handleImageLoad}
                onError={() => {
                  setImageLoaded(false);
                  setLoadError("Failed to load image preview.");
                }}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  maxHeight: "none",
                  maxWidth: "none",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="pointer-events-auto cursor-grab active:cursor-grabbing object-contain select-none"
                draggable={false}
              />
            </div>

            {/* Subtle Overlay Guide */}
            <div className="pointer-events-none absolute bottom-2 right-2 z-20 bg-black/60 backdrop-blur-xs text-white/80 text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
              <Move className="h-2.5 w-2.5" />
              <span>Drag to Pan &bull; 16:9 Box</span>
            </div>
          </div>
        </div>

        {/* Minimal Controls Bar */}
        <div className="px-5 py-3 border-t border-border/60 bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2.5 flex-1 max-w-xs">
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

              <span className="text-xs font-mono font-medium text-foreground min-w-[38px] text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="h-8 gap-1 text-xs font-mono"
                title="Rotate 90 degrees"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Rotate</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1 text-xs font-mono text-muted-foreground"
                title="Reset zoom & position"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/60 bg-muted/30 shrink-0">
          <div className="text-xs text-muted-foreground font-mono">
            {naturalSize.w > 0 && (
              <span>Source: {naturalSize.w} &times; {naturalSize.h} px &bull; Output: 16:9</span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
                  <span>Cropping...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Apply 16:9 Crop</span>
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
