"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "m-auto max-h-[85vh] w-full max-w-lg rounded-xl border border-border bg-bg-card p-0 shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        "open:animate-in open:fade-in-0 open:zoom-in-95",
        className
      )}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="p-6">{children}</div>
    </dialog>
  );
}

interface DialogHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

function DialogHeader({ children, onClose, className }: DialogHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2 className="text-lg font-semibold text-text">{children}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-muted hover:bg-bg-muted hover:text-text transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export { Dialog, DialogHeader };
