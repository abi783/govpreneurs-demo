// The bottom sheet, once, for every sheet this feature has or grows.
//
// WHY THIS EXISTS. Both sheets used to hand-roll `<div role="dialog"
// aria-modal="true">` over a scrim, and both got the same four things wrong:
// focus never moved in, so `document.activeElement` stayed on the button behind
// the blur; Tab walked straight out of the sheet into the order cards under it;
// Escape did nothing; and the background was never inerted for a screen reader.
// Fixing that at one of the two would have left the other broken and taught the
// third one nothing, so it is fixed for every sheet in this feature at once.
//
// WHAT THIS FILE IS AND IS NOT. It is the bottom-sheet SHELL, not the app's
// dialog class. That class is `components/ui/Modal.tsx`, the Radix wrapper
// SourceRef/SourceSheet.tsx uses. This file does not extend it, and the reason
// is geometry, not preference: `.mp-sheet-scrim` is `display:flex;
// align-items:flex-end` and `.mp-sheet` is its `width:100%` child, so Content
// must nest INSIDE Overlay — while ModalContent renders them as siblings for a
// centred modal. Making one shell serve both would mean restructuring the DOM
// of every dialog in the app, which is a larger and riskier change than the
// eight lines of focus handling that are actually shared.
//
// THE CLASS NOW CARRIES ITS OWN PAIR. That escalation landed: ModalContent
// implements onOpenAutoFocus/onCloseAutoFocus as overridable defaults, and
// SourceChip's `e.currentTarget.blur()` is gone with it. This file still keeps
// its own two, and not out of duplication — the OPEN behaviour is deliberately
// different. ModalContent lets Radix focus the first control and only records
// the opener; a triggerless bottom sheet has to focus the sheet ITSELF so a
// screen reader names what opened before it reads the first button. See 1 and 2
// below.
//
// Almost none of the rest is our code. `@radix-ui/react-dialog` is already a
// dependency and already the base of `components/ui/Modal.tsx`; it brings the
// focus trap, the Escape handler, the outside-click dismissal, the scroll lock
// and `aria-hidden` on everything behind. What this file adds is the two things
// Radix cannot know:
//
//   1 · WHERE FOCUS GOES ON OPEN. Radix focuses the first control inside. We
//       focus the sheet itself, so a screen reader says what opened before it
//       reads the first control, and Tab then walks the sheet from the top.
//   2 · WHERE FOCUS GOES ON CLOSE. Radix's modal default focuses
//       `<Dialog.Trigger>` — and these sheets have none, because the control
//       that opens them lives on the board and mounts them through route state.
//       `triggerRef.current` is null, so focus silently fell to <body> and a
//       keyboard user restarted at the top of the page. We remember what was
//       focused when the sheet mounted and put it back.
//
// The scrim is the flex parent that positions the panel, so Content nests
// inside Overlay rather than sitting beside it. Both variants below keep that
// nesting, because both scrims are flex parents.
//
// TWO PRESENTATIONS, ONE SHELL. The owner read the "Narrow this down" filter as
// a separate PAGE, and the geometry agrees: `.mp-sheet` is `max-height: 88vh`
// pinned to the bottom edge, which fills a desktop viewport. The opportunities
// list already owns the look a filter should wear — `FiltersDrawer`'s
// `.fd-overlay` / `.fd-panel` side drawer — so `variant="panel"` dresses this
// shell in those classes. It is a SKIN, not a second dialog: every focus
// behaviour above is the same code on both paths. Hand-rolling a second Radix
// wrapper for the panel would have forked the two things Radix cannot know, and
// the fork is what this file exists to prevent.
import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/** Which presentation the shell wears. `sheet` is the bottom sheet; `panel` is
 *  the opportunities page's side drawer. */
export type MicroSheetVariant = "sheet" | "panel";

/** The classes each presentation owns. Named here so no caller spells one. */
const SKIN = {
  // `scrim` is the app's glass overlay — `position: fixed`, `inset: 0` and the
  // blur. Worn by name, as the panel wears `fd-overlay`; without it the sheet
  // was an ordinary block at the end of the page, under the board.
  sheet: { scrim: "scrim mp-sheet-scrim", surface: "mp-sheet" },
  panel: { scrim: "fd-overlay mp-panel-scrim", surface: "fd-panel mp-panel" },
} as const;

/** The eyebrow over the panel's title, matching the opportunities drawer. */
const PANEL_KICKER = "Refine";

export function MicroSheet({
  title,
  variant = "sheet",
  onClose,
  children,
}: {
  /** Names the dialog. Radix wires it to `aria-labelledby` for us. */
  title: string;
  /** Defaults to the bottom sheet, so an existing caller reads unchanged. */
  variant?: MicroSheetVariant;
  onClose: () => void;
  children: ReactNode;
}) {
  // Read during the first render, which is BEFORE Radix moves focus in its
  // mount effect — so this is still the control she pressed to get here.
  const opener = useRef<HTMLElement | null>(
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );

  return (
    // Mounted only while open, so `open` is constant and closing is an unmount.
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={SKIN[variant].scrim}>
          <Dialog.Content
            className={SKIN[variant].surface}
            // No `<Dialog.Description>`: the sheet's own first paragraph is read
            // as content. Saying so explicitly is what stops Radix warning.
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement | null)?.focus();
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              opener.current?.focus();
            }}
          >
            {variant === "panel" ? (
              <PanelChrome title={title}>{children}</PanelChrome>
            ) : (
              <>
                <Dialog.Title className="mp-sheet__title">{title}</Dialog.Title>
                {children}
              </>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The panel's header and scroll region, in the opportunities drawer's own
 *  classes. The header carries the title so a screen reader hears the panel
 *  named, and the body scrolls so a sticky foot inside `children` still sticks. */
function PanelChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="fd-head">
        <div>
          <div className="t-label">{PANEL_KICKER}</div>
          <Dialog.Title className="fd-title">{title}</Dialog.Title>
        </div>
        {/* Radix renders the button and owns the close, so this control needs
            no handler of its own — same reason as SheetCancel below. */}
        <Dialog.Close className="fd-close" aria-label="Close">
          <X size={18} />
        </Dialog.Close>
      </header>
      <div className="fd-body mp-panel__body">{children}</div>
    </>
  );
}

/** The way out. Every sheet gets one, in the foot, spelled the same way —
 *  the narrow sheet used to have none at all while its sibling had "Cancel",
 *  so the two taught opposite lessons about how to leave. */
export function SheetCancel() {
  // Radix renders the button element itself here, carrying its own type and its
  // own onClick — so there is no handler-less markup for the dead-control check
  // to find, and no `asChild` wrapper for it to read past.
  return <Dialog.Close className="btn btn-ghost">Cancel</Dialog.Close>;
}
