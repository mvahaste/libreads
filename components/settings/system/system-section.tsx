import StatCard from "@/components/ui/stat-card";
import { LucideBookOpen, LucideBuilding2, LucidePen, LucideShapes, LucideTag, LucideUsers } from "lucide-react";
import { ReactNode } from "react";

import { SettingsGroup } from "../settings-group";

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
