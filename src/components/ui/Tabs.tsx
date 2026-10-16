import { forwardRef, type ComponentPropsWithoutRef } from "react";
import * as RTabs from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const tabsListVariants = cva("ui-tabs-list", {
  variants: {
    variant: {
      primary: "ui-tabs-list--primary",
      sub: "ui-tabs-list--sub",
    },
  },
  defaultVariants: { variant: "primary" },
});

export const tabsTriggerVariants = cva("ui-tabs-trigger", {
  variants: {
    variant: {
      primary: "ui-tabs-trigger--primary",
      sub: "ui-tabs-trigger--sub",
    },
  },
  defaultVariants: { variant: "primary" },
});

interface TabsListProps
  extends ComponentPropsWithoutRef<typeof RTabs.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { variant, className, ...rest },
  ref,
) {
  return <RTabs.List ref={ref} className={cn(tabsListVariants({ variant }), className)} {...rest} />;
});

interface TabsTriggerProps
  extends ComponentPropsWithoutRef<typeof RTabs.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { variant, className, ...rest },
  ref,
) {
  return (
    <RTabs.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...rest}
    />
  );
});

const TabsContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof RTabs.Content>>(
  function TabsContent({ className, ...rest }, ref) {
    return <RTabs.Content ref={ref} className={cn("ui-tabs-content", className)} {...rest} />;
  },
);

export const Tabs = {
  Root: RTabs.Root,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};
