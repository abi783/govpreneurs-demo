// DEMO: shows the message that `showDemoNotice()` (src/demo/ui/notice.ts) sends.

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { DEMO_NOTICE_EVENT, type DemoNotice } from "../ui/notice";

export function DemoNoticeHost() {
  const [notice, setNotice] = useState<DemoNotice | null>(null);

  useEffect(() => {
    const onNotice = (e: Event) => setNotice((e as CustomEvent<DemoNotice>).detail);
    window.addEventListener(DEMO_NOTICE_EVENT, onNotice);
    return () => window.removeEventListener(DEMO_NOTICE_EVENT, onNotice);
  }, []);

  return (
    <Dialog.Root open={notice !== null} onOpenChange={(o) => !o && setNotice(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="demo-overlay" />
        <Dialog.Content className="demo-dialog">
          <Dialog.Title className="demo-dialog__title">{notice?.title}</Dialog.Title>
          <Dialog.Description className="demo-dialog__text">
            {notice?.message}
          </Dialog.Description>
          <div className="demo-dialog__actions">
            <Dialog.Close asChild>
              <button type="button" className="demo-btn demo-btn--primary">
                OK
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
