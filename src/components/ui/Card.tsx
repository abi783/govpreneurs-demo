import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const cardVariants = cva("ui-card", {
  variants: {
    variant: {
      default: "ui-card--default",
      compact: "ui-card--compact",
      agent: "ui-card--agent",
    },
    dense: {
      true: "ui-card--dense",
      false: "",
    },
    interactive: {
      true: "ui-card--interactive",
      false: "",
    },
  },
  defaultVariants: { variant: "default", dense: false, interactive: false },
});

type Agent = "hunter" | "grant" | "ava";

type BaseProps = HTMLAttributes<HTMLElement> &
  Omit<VariantProps<typeof cardVariants>, "variant"> & {
    asChild?: boolean;
    children?: ReactNode;
  };

type DefaultProps = BaseProps & { variant?: "default" | "compact"; agent?: never };
type AgentProps = BaseProps & { variant: "agent"; agent: Agent };

export type CardProps = DefaultProps | AgentProps;

const CardRoot = forwardRef<HTMLElement, CardProps>(function Card(props, ref) {
  const {
    variant = "default",
    dense,
    interactive,
    asChild,
    className,
    onClick,
    onKeyDown,
    children,
    ...rest
  } = props as BaseProps & { variant?: "default" | "compact" | "agent" };
  const agent = (props as AgentProps).agent;

  const isInteractive = !!interactive || typeof onClick === "function";
  const agentClass = variant === "agent" && agent ? `ui-card--agent-${agent}` : "";

  const Comp: any = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref as any}
      className={cn(
        cardVariants({ variant, dense, interactive: isInteractive }),
        agentClass,
        className,
      )}
      onClick={onClick}
      onKeyDown={(e: any) => {
        onKeyDown?.(e);
        if (asChild) return; // child element owns its own activation semantics
        if (!isInteractive || e.defaultPrevented) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).click();
        }
      }}
      role={!asChild && isInteractive && !rest.role ? "button" : rest.role}
      tabIndex={!asChild && isInteractive ? (rest.tabIndex ?? 0) : rest.tabIndex}
      {...rest}
    >
      {children}
    </Comp>
  );
});

function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card__header", className)} {...rest} />;
}
function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card__body", className)} {...rest} />;
}
function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card__footer", className)} {...rest} />;
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
