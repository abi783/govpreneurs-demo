export interface ClickRecord {
  role: string;
  name: string;
  selector: string;
}

export interface ClickFailure extends ClickRecord {
  error: string;
}

export interface RouteResult {
  route: string;
  ok: boolean;
  ms: number;
  /** Number of clickables that were clicked. */
  clicks: number;
  /** Failures from loading the page (and the overflow check). */
  errors: string[];
  deadClicks: ClickRecord[];
  clickFailures: ClickFailure[];
  /** Things worth a look that do not fail the run. */
  warnings: string[];
}
