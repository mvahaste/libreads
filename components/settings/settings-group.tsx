import { Separator } from "@/components/ui/separator";

interface SettingsGroupProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsGroup({ title, description, action, children }: SettingsGroupProps) {
  const header = (
    <div>
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );

  return (
    <div>
      {action ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {header}
          {action}
        </div>
      ) : (
        header
      )}
      <Separator className="my-4" />
      {children}
    </div>
  );
}
