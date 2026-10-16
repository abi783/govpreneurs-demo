import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      danger: "btn-danger",
      brand: "btn-brand",
      ai: "btn-ai",
    },
    size: {
      sm: "btn-sm",
      md: "",
    },
    iconOnly: {
      true: "btn-icon-only",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    iconOnly: false,
  },
});

type CommonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  Omit<VariantProps<typeof buttonVariants>, "iconOnly">;

/**
 * Discriminated union enforces an accessible name at the type level:
 *  - text button:  must pass `children`
 *  - icon button:  must pass `icon` + `aria-label`
 */
type TextButtonProps = CommonProps & {
  children: ReactNode;
  icon?: never;
  "aria-label"?: string;
};

type IconButtonProps = CommonProps & {
  icon: ReactNode;
  "aria-label": string;
  children?: never;
};

export type ButtonProps = TextButtonProps | IconButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  props,
  ref,
) {
  const { variant, size, className, type = "button", ...rest } = props as CommonProps & {
    children?: ReactNode;
    icon?: ReactNode;
    className?: string;
    type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  };
  const iconOnly = "icon" in props && props.icon != null && !("children" in props && props.children);

  const content = iconOnly ? (props as IconButtonProps).icon : (props as TextButtonProps).children;
  // Strip primitive-only keys before spreading onto the DOM node.
  const { icon: _icon, children: _children, ...domRest } = rest as {
    icon?: ReactNode;
    children?: ReactNode;
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, iconOnly }), className)}
      {...domRest}
    >
      {content}
    </button>
  );
});
