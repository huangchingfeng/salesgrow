"use client";

import { forwardRef, useEffect, useRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, onChange, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = () => {
      const el = internalRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={(el) => {
            internalRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          className={cn(
            "min-h-[80px] w-full resize-none rounded-lg border bg-bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            error
              ? "border-danger focus:ring-danger"
              : "border-border hover:border-border-hover",
            className
          )}
          onChange={(e) => {
            onChange?.(e);
            adjustHeight();
          }}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
