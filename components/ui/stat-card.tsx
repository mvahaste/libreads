import { ReactNode } from "react";

import { Card } from "./card";
import { IconBox } from "./icon-box";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value?: string;
  noValueLabel?: string;
}

export default function StatCard({ icon, label, value, noValueLabel }: StatCardProps) {
  return (
    <Card className="flex flex-row items-start gap-4 p-4">
      <IconBox>{icon}</IconBox>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
        {value && <p className="text-foreground -mb-4 text-lg font-bold tabular-nums">{value}</p>}
        {!value && noValueLabel && (
          <p className="text-muted-foreground text-medium -mb-4 font-mono font-medium">{noValueLabel}</p>
        )}
      </div>
    </Card>
  );
}
