// A render-error boundary small enough to wrap ONE surface.
//
// Without a local boundary the nearest one is the router root's
// `errorComponent`, so a single malformed card — a matches payload with no
// rows, a gap kind that resolves to `Object.prototype` — blanks the member's
// whole feed route. A boundary is not a substitute for fixing the throw (it
// would hide the next real bug); it is what keeps one bad payload from costing
// everything else on the page.
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Named in the console line, so a caught throw is attributable. */
  label: string;
  /** What to show instead. Defaults to nothing — a card that cannot render is
   *  better absent than replaced by an apology in the middle of a conversation. */
  fallback?: ReactNode;
}

interface State {
  failed: boolean;
}

/** Contains a render throw to the subtree it wraps. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Never swallowed: a contained throw is still a defect somebody must see.
    console.error(`${this.props.label} failed to render:`, error, info);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
