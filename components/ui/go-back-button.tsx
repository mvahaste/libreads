"use client";

import { useRouter } from "next/navigation";

import { Button } from "./button";

export function GoBackButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const router = useRouter();

  return (
    <Button {...props} onClick={() => router.back()}>
      {children}
    </Button>
  );
}
