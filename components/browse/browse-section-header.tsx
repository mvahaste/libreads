import { Separator } from "@/components/ui/separator";

interface BrowseSectionHeaderProps {
  title: string;
  description: string;
}

export function BrowseSectionHeader({ title, description }: BrowseSectionHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-foreground text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      <Separator className="mt-4" />
    </div>
  );
}
