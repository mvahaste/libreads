"use client";

import { cn } from "@/lib/utils/cn";
import { useEffect, useRef, useState } from "react";

export function BookDescription({
  description,
  className,
}: {
  description: string | undefined | null;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight);
    }
  }, [description]);

  if (!description) return null;

  return (
    <div className={className}>
      <div className="relative">
        <p ref={ref} className={cn("text-base leading-6 whitespace-pre-wrap", !expanded && "line-clamp-3")}>
          {description}
        </p>
        {clamped && !expanded && (
          <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 h-12 bg-linear-to-t to-transparent" />
        )}
      </div>
      {clamped && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-muted-foreground hover:text-foreground mt-1 cursor-pointer text-sm"
        >
          Show more
        </button>
      )}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="text-muted-foreground hover:text-foreground mt-1 cursor-pointer text-sm"
        >
          Show less
        </button>
      )}
    </div>
  );
}
