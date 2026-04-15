import Link from "next/link";

interface MetaLabelProps {
  label: string;
  value: string | number | null | undefined;
  href?: string;
}

export function MetaLabel({ label, value, href }: MetaLabelProps) {
  if (!value) return null;

  return (
    <p className="text-muted-foreground text-sm">
      {label}
      {href ? (
        <Link href={href} className="text-foreground ml-1 font-medium hover:underline">
          {value}
        </Link>
      ) : (
        <span className="text-foreground ml-1 font-medium">{value}</span>
      )}
    </p>
  );
}
