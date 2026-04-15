"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils/cn";
import * as React from "react";

type ResponsiveDialogContextValue = {
  isMobile: boolean;
};

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue | null>(null);

function useResponsiveDialogContext(componentName: string) {
  const context = React.useContext(ResponsiveDialogContext);
  if (!context) {
    throw new Error(`${componentName} must be used within ResponsiveDialog`);
  }

  return context;
}

type ResponsiveDialogProps = React.PropsWithChildren<
  React.ComponentProps<typeof Dialog> & React.ComponentProps<typeof Drawer>
>;

function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile }}>
      {isMobile ? <Drawer {...props}>{children}</Drawer> : <Dialog {...props}>{children}</Dialog>}
    </ResponsiveDialogContext.Provider>
  );
}

function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogTrigger");

  if (isMobile) {
    return <DrawerTrigger {...props} />;
  }

  return <DialogTrigger {...props} />;
}

type ResponsiveDialogContentProps = React.PropsWithChildren<
  Omit<React.ComponentProps<typeof DialogContent>, "className"> &
    Omit<React.ComponentProps<typeof DrawerContent>, "className"> & {
      className?: string;
      dialogClassName?: string;
      drawerClassName?: string;
      dialogShowCloseButton?: boolean;
    }
>;

function ResponsiveDialogContent({
  children,
  className,
  dialogClassName,
  drawerClassName,
  dialogShowCloseButton,
  ...props
}: ResponsiveDialogContentProps) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogContent");

  if (isMobile) {
    return (
      <DrawerContent className={cn(className, drawerClassName)} {...props}>
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn(className, dialogClassName)} showCloseButton={dialogShowCloseButton} {...props}>
      {children}
    </DialogContent>
  );
}

function ResponsiveDialogHeader(props: React.ComponentProps<typeof DialogHeader>) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogHeader");

  if (isMobile) {
    return <DrawerHeader {...props} />;
  }

  return <DialogHeader {...props} />;
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogTitle");

  if (isMobile) {
    return <DrawerTitle {...props} />;
  }

  return <DialogTitle {...props} />;
}

function ResponsiveDialogDescription(props: React.ComponentProps<typeof DialogDescription>) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogDescription");

  if (isMobile) {
    return <DrawerDescription {...props} />;
  }

  return <DialogDescription {...props} />;
}

/**
 * NOTE: Keep action order consistent: dismissive, then destructive, then primary.
 */
function ResponsiveDialogFooter(props: React.ComponentProps<typeof DialogFooter>) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogFooter");

  if (isMobile) {
    return <DrawerFooter {...props} />;
  }

  return <DialogFooter {...props} />;
}

function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogClose");

  if (isMobile) {
    return <DrawerClose {...props} />;
  }

  return <DialogClose {...props} />;
}

type ResponsiveDialogBodyProps = React.ComponentProps<"div"> & {
  mobilePadded?: boolean;
};

function ResponsiveDialogBody({ className, mobilePadded = true, ...props }: ResponsiveDialogBodyProps) {
  const { isMobile } = useResponsiveDialogContext("ResponsiveDialogBody");

  return <div className={cn(mobilePadded && isMobile && "px-4", className)} {...props} />;
}

function useResponsiveDialogMode() {
  return useResponsiveDialogContext("useResponsiveDialogMode");
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  useResponsiveDialogMode,
};
