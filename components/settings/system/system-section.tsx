import { IconBox } from "@/components/ui/icon-box";
import { LucideBookOpen, LucideBuilding2, LucidePen, LucideShapes, LucideTag, LucideUsers } from "lucide-react";
import { ReactNode } from "react";

import { SettingsGroup } from "../settings-group";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="border-border bg-card flex items-start gap-4 rounded-lg border p-4">
      <IconBox>{icon}</IconBox>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
        <p className="text-foreground -mb-4 text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export type SystemStatKey = "users" | "books" | "authors" | "genres" | "publishers" | "series";

interface SystemSectionProps {
  title: string;
  description: string;
  labels: Record<SystemStatKey, string>;
  stats: Record<SystemStatKey, number>;
}

const statIcons: Record<SystemStatKey, ReactNode> = {
  users: <LucideUsers className="text-primary size-5" />,
  books: <LucideBookOpen className="text-primary size-5" />,
  authors: <LucidePen className="text-primary size-5" />,
  genres: <LucideTag className="text-primary size-5" />,
  publishers: <LucideBuilding2 className="text-primary size-5" />,
  series: <LucideShapes className="text-primary size-5" />,
};

export function SystemSection({ title, description, labels, stats }: SystemSectionProps) {
  const orderedKeys: SystemStatKey[] = ["users", "books", "authors", "genres", "publishers", "series"];

  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup title={title} description={description}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedKeys.map((key) => (
            <StatCard key={key} icon={statIcons[key]} label={labels[key]} value={stats[key].toLocaleString()} />
          ))}
        </div>
      </SettingsGroup>
    </div>
  );
}
