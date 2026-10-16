import type { Locator, Page } from "@playwright/test";

/**
 * The "Send to a mentor" dialog (`components/Mentors/MentorSendModal.tsx`) and
 * the two pages that open it: an opportunity (`/opportunities/$noticeId`, via
 * Grant's "Review with mentor") and a DIBBS small order
 * (`/small-orders/$orderId`, via "Send to mentor").
 *
 * No `expect` here: locators and actions only.
 */
export class MentorSendDialog {
  readonly root: Locator;
  readonly title: Locator;
  readonly snapshot: Locator;
  readonly closeX: Locator;
  readonly cancel: Locator;
  readonly send: Locator;
  readonly question: Locator;
  readonly fileInput: Locator;
  readonly fileName: Locator;
  readonly removeFile: Locator;
  readonly chooseFile: Locator;
  readonly fileError: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole("dialog", { name: "Send to a mentor" });
    this.title = this.root.getByRole("heading", { name: "Send to a mentor" });
    this.snapshot = this.root.locator(".mentor-modal__snapshot");
    this.closeX = this.root.getByRole("button", { name: "Close" });
    this.cancel = this.root.getByRole("button", { name: "Cancel" });
    this.send = this.root.getByRole("button", { name: /^Send for / });
    this.question = this.root.getByLabel(/Your question for the mentor/);
    this.fileInput = this.root.getByLabel(/Attach a file/);
    this.chooseFile = this.root.locator(".mentor-modal__file-btn");
    this.fileName = this.root.locator(".mentor-modal__file-name");
    this.removeFile = this.root.getByRole("button", { name: "Remove file" });
    this.fileError = this.root.locator(".mentor-modal__file-error");
  }

  /** A checkbox in the dialog — the "I've read" tick or a help topic. */
  checkbox(name: RegExp | string): Locator {
    return this.root.getByRole("checkbox", { name });
  }

  /** Every help-topic checkbox, in the order the dialog lists them. */
  topics(): Locator {
    return this.root.locator(".mentor-modal__topic");
  }

  async attach(name: string, mimeType: string, bytes = 16): Promise<void> {
    await this.fileInput.setInputFiles({ name, mimeType, buffer: Buffer.alloc(bytes, 65) });
  }

  /**
   * Pick a file through the "Choose file" button: the real click path a member
   * takes, which must open the browser's file chooser.
   */
  async chooseThroughButton(name: string, mimeType: string): Promise<void> {
    const [chooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.chooseFile.click(),
    ]);
    await chooser.setFiles({ name, mimeType, buffer: Buffer.from("%PDF-1.4") });
  }
}

/** The opportunity page, far enough to open the dialog. */
export class OpportunityMentorPage {
  readonly showAnalysis: Locator;
  readonly reviewWithMentor: Locator;
  readonly alerts: Locator;
  /** Page alerts while the dialog is open, which hides the page from a11y. */
  readonly alertsBehindDialog: Locator;
  readonly dialog: MentorSendDialog;

  constructor(private readonly page: Page) {
    this.alertsBehindDialog = page.getByRole("alert", { includeHidden: true });
    this.showAnalysis = page.getByRole("button", { name: /Show me the analysis/ });
    // Grant's next-step block; the header carries a second "Review with Mentor".
    this.reviewWithMentor = page.locator(".gt-next__actions").getByRole("button", {
      name: "Review with mentor",
    });
    this.alerts = page.getByRole("alert");
    this.dialog = new MentorSendDialog(page);
  }

  async open(oppId: string): Promise<void> {
    await this.page.goto(`./opportunities/${oppId}`);
    await this.showAnalysis.click();
    await this.reviewWithMentor.waitFor();
  }

  async openDialog(): Promise<void> {
    await this.reviewWithMentor.click();
    await this.dialog.root.waitFor();
  }
}

/** A small order's page, far enough to open the dialog. */
export class SmallOrderMentorPage {
  readonly sendToMentor: Locator;
  readonly sentLine: Locator;
  readonly alerts: Locator;
  readonly dialog: MentorSendDialog;

  constructor(private readonly page: Page) {
    this.sendToMentor = page.getByRole("button", { name: "Send to mentor" });
    this.sentLine = page.getByText("Sent to a mentor. The answer will be in Mentors.");
    this.alerts = page.getByRole("alert");
    this.dialog = new MentorSendDialog(page);
  }

  async open(orderId: string): Promise<void> {
    await this.page.goto(`./small-orders/${orderId}`);
    await this.sendToMentor.first().waitFor();
  }

  async openDialog(): Promise<void> {
    await this.sendToMentor.first().click();
    await this.dialog.root.waitFor();
  }
}
