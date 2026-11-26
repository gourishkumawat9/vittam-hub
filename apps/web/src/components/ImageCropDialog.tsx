"use client";

import { Button, Dialog } from "@vittamhub/ui";
import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

const VIEWPORT = 288;
const MAX_ZOOM = 4;

interface ImageCropDialogProps {
  file: File | null;
  /** "circle" for a profile photo (LinkedIn-style), "square" for a logo. */
  shape: "circle" | "square";
  /** Width and height of the saved image, in pixels. */
  outputSize: number;
  outputType: "image/jpeg" | "image/png" | "image/webp";
  title: string;
  onCancel: () => void;
  onApply: (cropped: File) => void;
}

interface Frame {
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Crop and zoom an image before it's uploaded, the way LinkedIn does a profile
 * photo: the picture sits under a round (or square) frame, you drag it to
 * position it and zoom with the slider, the arrow keys or the +/- buttons, and
 * what is inside the frame is saved at a fixed size. Runs in the browser on a
 * canvas; only the cropped image is uploaded.
 */
export function ImageCropDialog({ file, shape, outputSize, outputType, title, onCancel, onApply }: ImageCropDialogProps) {
  const [source, setSource] = useState<string | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const zoomId = useId();

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSource(url);
    setFrame(null);
    setZoom(1);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The scale at which the image just covers the frame; zoom multiplies it.
  const baseScale = frame ? Math.max(VIEWPORT / frame.width, VIEWPORT / frame.height) : 1;
  const scale = baseScale * zoom;

  const clampOffset = useCallback(
    (x: number, y: number, atScale: number) => {
      if (!frame) return { x, y };
      return {
        x: clamp(x, VIEWPORT - frame.width * atScale, 0),
        y: clamp(y, VIEWPORT - frame.height * atScale, 0),
      };
    },
    [frame],
  );

  const onImageLoad = () => {
    const image = imageRef.current;
    if (!image) return;
    const next = { width: image.naturalWidth, height: image.naturalHeight };
    const startScale = Math.max(VIEWPORT / next.width, VIEWPORT / next.height);
    setFrame(next);
    setOffset({ x: (VIEWPORT - next.width * startScale) / 2, y: (VIEWPORT - next.height * startScale) / 2 });
  };

  /** Zooms around the middle of the frame, so what you're looking at stays put. */
  const applyZoom = (nextZoom: number) => {
    const target = clamp(nextZoom, 1, MAX_ZOOM);
    const nextScale = baseScale * target;
    const centreX = (VIEWPORT / 2 - offset.x) / scale;
    const centreY = (VIEWPORT / 2 - offset.y) / scale;
    setZoom(target);
    setOffset(clampOffset(VIEWPORT / 2 - centreX * nextScale, VIEWPORT / 2 - centreY * nextScale, nextScale));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, startX: offset.x, startY: offset.y };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const { x, y, startX, startY } = drag.current;
    setOffset(clampOffset(startX + event.clientX - x, startY + event.clientY - y, scale));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 24 : 8;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setOffset(clampOffset(offset.x + move[0], offset.y + move[1], scale));
    } else if (event.key === "+" || event.key === "=") {
      applyZoom(zoom + 0.2);
    } else if (event.key === "-") {
      applyZoom(zoom - 0.2);
    }
  };

  const apply = async () => {
    const image = imageRef.current;
    if (!image || !frame || !file) return;
    setIsSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser can't crop images");
      if (outputType === "image/jpeg") {
        // JPEG has no transparency: a transparent PNG would otherwise turn black.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, outputSize, outputSize);
      }
      context.imageSmoothingQuality = "high";
      const sourceSize = VIEWPORT / scale;
      context.drawImage(image, -offset.x / scale, -offset.y / scale, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, 0.9));
      if (!blob) throw new Error("Couldn't save the cropped image");
      const extension = outputType.split("/")[1] === "jpeg" ? "jpg" : outputType.split("/")[1];
      const name = `${file.name.replace(/\.[^.]+$/, "") || "image"}-cropped.${extension}`;
      onApply(new File([blob], name, { type: outputType }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={!!file}
      onOpenChange={(open) => !open && onCancel()}
      title={title}
      description="Drag to position it, and zoom to fit. What's inside the frame is what people see."
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={apply} isLoading={isSaving} disabled={!frame}>
            Apply
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5">
        <div
          role="application"
          aria-label="Image position. Drag, or use the arrow keys to move it and plus or minus to zoom."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="relative cursor-grab touch-none select-none overflow-hidden rounded-card bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:cursor-grabbing"
          style={{ width: VIEWPORT, height: VIEWPORT }}
        >
          {source && (
            // eslint-disable-next-line @next/next/no-img-element -- a local object URL being cropped, not a page image
            <img
              ref={imageRef}
              src={source}
              alt=""
              draggable={false}
              onLoad={onImageLoad}
              className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
              style={frame ? { width: frame.width * scale, height: frame.height * scale, transform: `translate(${offset.x}px, ${offset.y}px)` } : { opacity: 0 }}
            />
          )}
          {/* The frame: everything outside it is dimmed, as LinkedIn does. */}
          <div
            aria-hidden="true"
            className={cn("pointer-events-none absolute inset-0 ring-2 ring-white/90", shape === "circle" ? "rounded-full" : "rounded-md")}
            style={{ boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)" }}
          />
        </div>

        <div className="flex w-full max-w-xs items-center gap-3">
          <button
            type="button"
            onClick={() => applyZoom(zoom - 0.2)}
            aria-label="Zoom out"
            className="rounded-full p-1.5 text-text-secondary hover:bg-background-secondary hover:text-text-primary"
          >
            <Minus className="h-4 w-4" />
          </button>
          <label htmlFor={zoomId} className="sr-only">
            Zoom
          </label>
          <input
            id={zoomId}
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => applyZoom(Number(event.target.value))}
            className="w-full accent-brand-600"
          />
          <button
            type="button"
            onClick={() => applyZoom(zoom + 0.2)}
            aria-label="Zoom in"
            className="rounded-full p-1.5 text-text-secondary hover:bg-background-secondary hover:text-text-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
