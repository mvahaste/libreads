import { repository, version } from "@/package.json";
import { LucideExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="text-muted-foreground flex flex-col gap-1 px-4 pt-14 pb-6 text-center text-sm">
      <div className="mx-auto flex flex-row">
        <a
          href={repository}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary inline-flex items-center justify-center gap-1 transition-colors"
        >
          Libreads v{version}
          <LucideExternalLink className="inline size-3" />
        </a>
      </div>
    </footer>
  );
}
