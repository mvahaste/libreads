"use client";

import { Input } from "@/components/ui/input";
import { LucideSearch } from "lucide-react";
import { useEffect, useState } from "react";

interface BrowseSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function BrowseSearchInput({ value, onChange, placeholder, debounceMs = 300 }: BrowseSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  return (
    <div className="relative min-w-48 flex-1">
      <LucideSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
