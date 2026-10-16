// DEMO: the "Reset demo" confirm dialog. It is built in the app, not `window.confirm`.

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { resetDemo } from "../runtime/store";

export function ResetDemoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="demo-overlay" />
        <AlertDialog.Content className="demo-dialog">
          <AlertDialog.Title className="demo-dialog__title">Reset the demo?</AlertDialog.Title>
          <AlertDialog.Description className="demo-dialog__text">
            This removes every change you made, such as saved opportunities, tasks you ticked, and
            messages you sent. The demo then returns to the Success Center.
          </AlertDialog.Description>
          <div className="demo-dialog__actions">
            <AlertDialog.Cancel asChild>
              <button type="button" className="demo-btn">
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button type="button" className="demo-btn demo-btn--primary" onClick={() => resetDemo()}>
                Reset demo
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
