import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { IntroStrip } from "../../Knowledge/IntroStrip";
import { ConnectedSourcesList } from "../../Knowledge/ConnectedSourcesList";
import { YourFilesList } from "../../Knowledge/YourFilesList";
import { ConflictCallout } from "../../Knowledge/ConflictCallout";
import { StillMissing } from "../../Knowledge/StillMissing";
import { WhatWeLearned } from "../../Knowledge/WhatWeLearned";

export function KnowledgeTab() {
  return (
    <div className="kh-tab">
      <header className="kh-tab-head">
        <h2 className="kh-tab-title">Knowledge Hub</h2>
        <p className="kh-tab-sub">
          Everything Hunter has read about your business — and what would help
          him match you better.
        </p>
      </header>

      <IntroStrip />
      <ConnectedSourcesList />
      <YourFilesList />
      <WhatWeLearned />
      <ConflictCallout />
      <StillMissing />

      <div className="kh-tab-foot">
        <Link to="/cap-statement/builder" className="kh-tab-foot-link">
          Want a fresh capability statement? Build it with Ava
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
