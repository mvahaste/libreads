import { ReactNode } from "react";

import { IconBox } from "./icon-box";

interface IconCardProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}

export function IconCard({ icon, title, description, action }: IconCardProps) {
  return (
    <div className="border-border bg-card flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <IconBox>{icon}</IconBox>
        <div>
          <p className="text-foreground text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
