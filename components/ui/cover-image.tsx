"use client";

import { cn } from "@/lib/utils/cn";
import { getFallbackCoverUrl, getImageUrl } from "@/lib/utils/image-utils";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Skeleton } from "./skeleton";

interface CoverImageProps {
  width: number;
  height: number;
  className?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  localCoverId?: string;
}

export default function CoverImage({
  width,
  height,
  className,
  title,
  subtitle,
  imageUrl,
  localCoverId,
}: CoverImageProps) {
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleMount = () => setMounted(true);
    handleMount();
  }, []);

  function getCoverUrl() {
    if (imageUrl) return imageUrl;

    if (localCoverId) return getImageUrl(localCoverId)!;

    return getFallbackCoverUrl(title, subtitle, resolvedTheme);
  }

  const baseClassName = "aspect-[0.65/1] h-48 w-auto rounded-md object-cover";

  if (!mounted || !isLoaded) {
    return (
      <>
        <Skeleton className={cn(baseClassName, className)} />
        {mounted && (
          <Image
            src={getCoverUrl()}
            alt={title}
            width={width}
            height={height}
            className="invisible absolute h-0 w-0"
            onLoad={() => setIsLoaded(true)}
          />
        )}
      </>
    );
  }

  return (
    <Image src={getCoverUrl()} alt={title} width={width} height={height} className={cn(baseClassName, className)} />
  );
}
