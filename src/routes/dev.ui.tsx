import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Save, Trash2, Plus } from "lucide-react";
import { Avatar, Button, Card, Chip, Input, Modal, Tabs } from "@/components/ui";
import { usePageMeta } from "../components/Layout/page-meta";

export const Route = createFileRoute("/dev/ui")({
  head: () => ({
    meta: [{ title: "UI primitives · dev" }, { name: "robots", content: "noindex" }],
  }),
  component: UiPreviewPage,
});

function UiPreviewPage() {
  usePageMeta({});
  const [modalSize, setModalSize] = useState<null | "sm" | "md" | "lg">(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-8)", padding: "var(--s-4) 0" }}>
      <Section title="Button">
        <Row>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="brand">Brand</Button>
          <Button variant="ai">AI</Button>
        </Row>
        <Row>
          <Button size="sm" variant="primary">Primary sm</Button>
          <Button size="sm" variant="secondary">Secondary sm</Button>
          <Button size="sm" variant="ghost">Ghost sm</Button>
        </Row>
        <Row>
          <Button disabled>Disabled</Button>
          <Button icon={<Save size={14} aria-hidden />} aria-label="Save" />
          <Button size="sm" icon={<Trash2 size={14} aria-hidden />} aria-label="Delete" variant="danger" />
        </Row>
        {/*
          The following lines are intentionally NOT rendered. Uncommenting them
          must produce a TypeScript error — proving the a11y constraint:
            <Button icon={<Save />} />                  // missing aria-label
            <Button />                                  // no children and no icon
        */}
      </Section>

      <Section title="Card">
        <Row>
          <Card style={{ width: 260 }}>
            <Card.Header>
              <strong>Default card</strong>
            </Card.Header>
            <Card.Body>Body content sits inside Card.Body.</Card.Body>
            <Card.Footer>
              <Button size="sm" variant="ghost">Cancel</Button>
              <Button size="sm">Save</Button>
            </Card.Footer>
          </Card>
          <Card variant="compact" style={{ width: 260 }}>
            <Card.Body>Compact card — denser padding.</Card.Body>
          </Card>
          <Card variant="agent" agent="hunter" style={{ width: 220 }}>
            <Card.Body>Agent card — Hunter accent.</Card.Body>
          </Card>
          <Card variant="agent" agent="grant" style={{ width: 220 }}>
            <Card.Body>Agent card — Grant accent.</Card.Body>
          </Card>
          <Card variant="agent" agent="ava" style={{ width: 220 }}>
            <Card.Body>Agent card — Ava accent.</Card.Body>
          </Card>
          <Card interactive style={{ width: 260 }} onClick={() => alert("Card clicked")}>
            <Card.Body>Interactive — click or press Enter / Space.</Card.Body>
          </Card>
          <Card variant="compact" dense style={{ width: 260 }}>
            <Card.Body style={{ padding: 12 }}>Dense compact — child sections own padding.</Card.Body>
          </Card>
        </Row>
      </Section>

      <Section title="Chip">
        <Row>
          <Chip variant="status" tone="neutral" label="Neutral" />
          <Chip variant="status" tone="pos" label="Pos" />
          <Chip variant="status" tone="warn" label="Warn" />
          <Chip variant="status" tone="urg" label="Urgent" />
          <Chip variant="status" tone="insight" label="Insight" />
          <Chip variant="status" tone="ai" label="AI" />
        </Row>
        <Row>
          <Chip variant="filter" label="SDVOSB" onRemove={() => {}} />
          <Chip variant="filter" tone="insight" label="NAICS 238160" onRemove={() => {}} />
          <Chip variant="count" label="0" />
          <Chip variant="count" tone="pos" label="12" />
        </Row>
      </Section>

      <Section title="Input">
        <Row style={{ alignItems: "flex-start" }}>
          <div style={{ width: 240 }}>
            <Input label="Company name" placeholder="Williams Construction" />
          </div>
          <div style={{ width: 240 }}>
            <Input
              variant="search"
              aria-label="Search opportunities"
              placeholder="Search…"
              leadingIcon={<Search size={14} aria-hidden />}
            />
          </div>
          <div style={{ width: 120 }}>
            <Input variant="number" label="Hours" type="number" defaultValue={40} />
          </div>
          <div style={{ width: 240 }}>
            <Input size="sm" label="Small" placeholder="Small input" />
          </div>
        </Row>
        {/*
          Uncommenting either must be a TypeScript error:
            <Input variant="text" />                    // no label, no aria-label
            <Input placeholder="x" />                   // same
        */}
      </Section>

      <Section title="Modal">
        <Row>
          <Button variant="secondary" onClick={() => setModalSize("sm")}>Open sm</Button>
          <Button variant="secondary" onClick={() => setModalSize("md")}>Open md</Button>
          <Button variant="secondary" onClick={() => setModalSize("lg")}>Open lg</Button>
        </Row>
        <Modal.Root open={modalSize !== null} onOpenChange={(o) => !o && setModalSize(null)}>
          {modalSize ? (
            <Modal.Content size={modalSize}>
              <Modal.Header
                title={`Modal · ${modalSize}`}
                description="Built on @radix-ui/react-dialog — focus trap, Esc, scroll lock all included."
              />
              <Modal.Body>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--text-2)" }}>
                  Modal body content. Tab cycles focus inside; Esc or scrim click closes.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Modal.Close asChild>
                  <Button variant="ghost">Cancel</Button>
                </Modal.Close>
                <Modal.Close asChild>
                  <Button icon={<Plus size={14} aria-hidden />} aria-label="Confirm" />
                </Modal.Close>
              </Modal.Footer>
            </Modal.Content>
          ) : null}
        </Modal.Root>
      </Section>

      <Section title="Tabs">
        <Tabs.Root defaultValue="all">
          <Tabs.List variant="primary">
            <Tabs.Trigger variant="primary" value="all">All</Tabs.Trigger>
            <Tabs.Trigger variant="primary" value="bid">Bid</Tabs.Trigger>
            <Tabs.Trigger variant="primary" value="lean">Lean Bid</Tabs.Trigger>
            <Tabs.Trigger variant="primary" value="pass">Pass</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="all">All content</Tabs.Content>
          <Tabs.Content value="bid">Bid content</Tabs.Content>
          <Tabs.Content value="lean">Lean bid content</Tabs.Content>
          <Tabs.Content value="pass">Pass content</Tabs.Content>
        </Tabs.Root>

        <div style={{ marginTop: "var(--s-4)" }}>
          <Tabs.Root defaultValue="overview">
            <Tabs.List variant="sub">
              <Tabs.Trigger variant="sub" value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger variant="sub" value="details">Details</Tabs.Trigger>
              <Tabs.Trigger variant="sub" value="history">History</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="overview">Sub overview</Tabs.Content>
            <Tabs.Content value="details">Sub details</Tabs.Content>
            <Tabs.Content value="history">Sub history</Tabs.Content>
          </Tabs.Root>
        </div>
      </Section>

      <Section title="Avatar">
        <Row>
          <Avatar kind="agent" agent="hunter" size={20} />
          <Avatar kind="agent" agent="hunter" size={24} />
          <Avatar kind="agent" agent="hunter" size={28} />
          <Avatar kind="agent" agent="hunter" size={32} />
          <Avatar kind="agent" agent="hunter" size={40} />
          <Avatar kind="agent" agent="hunter" size={48} />
        </Row>
        <Row>
          <Avatar kind="agent" agent="grant" size={40} />
          <Avatar kind="agent" agent="ava" size={40} />
          <Avatar kind="human" name="Marcus Williams" size={40} />
          <Avatar kind="human" name="Sarah Lee" size={32} />
          <Avatar kind="human" name="J K" size={24} />
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap", ...style }}>
      {children}
    </div>
  );
}
