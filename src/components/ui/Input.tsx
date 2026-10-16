import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const inputVariants = cva("ui-input", {
  variants: {
    variant: {
      text: "ui-input--text",
      search: "ui-input--search",
      number: "ui-input--number",
    },
    size: {
      sm: "ui-input--sm",
      md: "ui-input--md",
    },
  },
  defaultVariants: { variant: "text", size: "md" },
});

type Common = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants> & {
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    containerClassName?: string;
  };

/**
 * Discriminated union enforces an accessible name at the type level:
 *   - labelled:    pass `label` (renders a <label htmlFor>)
 *   - aria only:   pass `aria-label`
 */
type LabelledProps = Common & {
  label: ReactNode;
  /** Optional id; auto-generated via useId if omitted. */
  id?: string;
  "aria-label"?: string;
};

type AriaOnlyProps = Common & {
  "aria-label": string;
  label?: never;
};

export type InputProps = LabelledProps | AriaOnlyProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    variant,
    size,
    className,
    containerClassName,
    leadingIcon,
    trailingIcon,
    ...rest
  } = props as Common & { label?: ReactNode; id?: string };

  const autoId = useId();
  const hasLabel = "label" in props && (props as LabelledProps).label != null;
  const id = rest.id ?? (hasLabel ? autoId : undefined);
  const labelNode = hasLabel ? (props as LabelledProps).label : null;

  const input = (
    <input
      ref={ref}
      id={id}
      className={cn(inputVariants({ variant, size }), className)}
      {...rest}
    />
  );

  const wrapped =
    leadingIcon || trailingIcon ? (
      <div className={cn("ui-input-wrap", containerClassName)}>
        {leadingIcon ? <span className="ui-input-affix ui-input-affix--lead">{leadingIcon}</span> : null}
        {input}
        {trailingIcon ? <span className="ui-input-affix ui-input-affix--trail">{trailingIcon}</span> : null}
      </div>
    ) : (
      input
    );

  if (hasLabel) {
    return (
      <div className={cn("ui-field", containerClassName)}>
        <label htmlFor={id} className="ui-field__label">
          {labelNode}
        </label>
        {wrapped}
      </div>
    );
  }
  return wrapped;
});
