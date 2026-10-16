import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const modalContentVariants = cva("ui-modal-content", {
  variants: {
    size: {
      sm: "ui-modal-content--sm",
      md: "ui-modal-content--md",
      lg: "ui-modal-content--lg",
    },
  },
  defaultVariants: { size: "md" },
});

interface ModalContentProps
  extends ComponentPropsWithoutRef<typeof Dialog.Content>,
    VariantProps<typeof modalContentVariants> {
  /** Optional accessible description. Title is rendered by <Modal.Header>. */
  description?: ReactNode;
  /** Set false to hide the overlay scrim (rare). */
  showOverlay?: boolean;
}

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(function ModalContent(
  { size, className, children, showOverlay = true, ...rest },
  ref,
) {
  return (
    <Dialog.Portal>
      {showOverlay ? <Dialog.Overlay className="ui-modal-overlay" /> : null}
      <Dialog.Content ref={ref} className={cn(modalContentVariants({ size }), className)} {...rest}>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
});

interface ModalHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  closeLabel?: string;
  className?: string;
}

function ModalHeader({ title, description, closeLabel = "Close", className }: ModalHeaderProps) {
  return (
    <header className={cn("ui-modal-header", className)}>
      <div className="ui-modal-header__text">
        <Dialog.Title className="ui-modal-title">{title}</Dialog.Title>
        {description ? (
          <Dialog.Description className="ui-modal-description">{description}</Dialog.Description>
        ) : null}
      </div>
      <Dialog.Close asChild>
        <button type="button" className="ui-modal-close" aria-label={closeLabel}>
          <X size={16} aria-hidden />
        </button>
      </Dialog.Close>
    </header>
  );
}

function ModalBody({
  className,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("ui-modal-body", className)} {...rest} />;
}

function ModalFooter({
  className,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("ui-modal-footer", className)} {...rest} />;
}

export const Modal = {
  Root: Dialog.Root,
  Trigger: Dialog.Trigger,
  Close: Dialog.Close,
  Title: Dialog.Title,
  Description: Dialog.Description,
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
};
