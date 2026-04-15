import { cn } from "@/lib/utils/cn";
import Link from "next/link";

interface AuthorListProps {
  authors: { id: string; name: string; slug: string }[];
  className?: string;
}

export function AuthorList({ authors, className }: AuthorListProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {authors.map((author, i) => (
        <span key={author.id} className="text-muted-foreground font-medium">
          <Link href={`/browse/books?author=${author.slug}`} className="hover:underline">
            {author.name}
          </Link>
          {i < authors.length - 1 && ","}
        </span>
      ))}
    </div>
  );
}
