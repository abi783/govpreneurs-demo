import * as Dialog from "@radix-ui/react-dialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

/** Confirmation modal for deleting a saved search. */
export function DeleteSavedSearchModal({
  open,
  onOpenChange,
  name,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="gate-modal__overlay" />
        <Dialog.Content className="gate-modal">
          <div className="gate-modal__icon" aria-hidden="true">
            <Trash2 size={18} />
          </div>
          <Dialog.Title className="gate-modal__title">Delete saved search?</Dialog.Title>
          <Dialog.Description className="gate-modal__body">
            Delete {name ? <strong>“{name}”</strong> : "this saved search"}? This can’t be undone.
          </Dialog.Description>
          <div className="gate-modal__actions">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              autoFocus
            >
              Delete
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
