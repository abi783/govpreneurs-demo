import * as Dialog from "@radix-ui/react-dialog";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";

export function LogoutConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  mode: "lead" | "admin";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="gate-modal__overlay" />
        <Dialog.Content className="gate-modal">
          <div className="gate-modal__icon" aria-hidden="true">
            <LogOut size={18} />
          </div>
          <Dialog.Title className="gate-modal__title">End this demo session?</Dialog.Title>
          <Dialog.Description className="gate-modal__body">
            {mode === "admin"
              ? "Admin mode will end and the next visitor will be asked to sign in before browsing the demo."
              : "The next visitor will be asked to sign in before browsing the demo."}
          </Dialog.Description>
          <div className="gate-modal__actions">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} autoFocus>
              End session
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
