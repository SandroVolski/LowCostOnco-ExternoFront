import React, { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { Textarea } from './textarea';

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export function AutoResizeTextarea({
  value,
  onChange,
  className,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to match the content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]); // Re-run when value changes

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={cn("min-h-[100px] overflow-hidden", className)}
      {...props}
    />
  );
} 