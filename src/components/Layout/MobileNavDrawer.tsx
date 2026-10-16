import * as Dialog from "@radix-ui/react-dialog";
import { SidebarContent } from "./Sidebar";

export function MobileNavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-drawer-overlay" />
        <Dialog.Content
          className="mobile-drawer-content"
          aria-label="Navigation"
          id="mobile-nav-drawer"
          onOpenAutoFocus={(e) => {
            // Don't auto-focus the first nav link — keep focus on the panel itself
            // so Tab cycles cleanly through links.
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          tabIndex={-1}
        >
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Main application navigation menu.
          </Dialog.Description>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
