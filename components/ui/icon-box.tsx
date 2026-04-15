import { cn } from "@/lib/utils/cn";
import { ReactNode } from "react";

interface IconBoxProps {
  children: ReactNode;
  className?: string;
}

export function IconBox({ children, className }: IconBoxProps) {
  return (
    <div className={cn("bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-md", className)}>
      {children}
    </div>
  );
}
