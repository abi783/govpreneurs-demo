import {
  Home as HomeIcon,
  Target,
  UserSquare,
  MessagesSquare,
  Building2,
  Trophy,
  Handshake,
  CalendarRange,
  FolderKanban,
  Sparkles,
  Search,
  Bookmark,
  Send,
  type LucideIcon,
} from "lucide-react";

export type CmdGroup = "Navigate" | "Search" | "Ask an agent" | "Quick actions";

export interface NavCommand {
  kind: "nav";
  id: string;
  group: "Navigate";
  icon: LucideIcon;
  label: string;
  hint: string; // shown on right
  to: string;
  keywords?: string[];
}

export interface DynamicCommand {
  kind: "search" | "ask-hunter" | "ask-grant" | "save-opp" | "send-mentor" | "go-saved";
  id: string;
  group: CmdGroup;
  icon: LucideIcon;
  label: string; // dynamic per query / context
  hint: string;
}

export type Command = NavCommand | DynamicCommand;

export const NAV_COMMANDS: NavCommand[] = [
  { kind: "nav", id: "nav-home", group: "Navigate", icon: HomeIcon, label: "Home", hint: "Page", to: "/home", keywords: ["dashboard", "start"] },
  { kind: "nav", id: "nav-opps", group: "Navigate", icon: Target, label: "Opportunities", hint: "Page", to: "/opportunities", keywords: ["hunter", "feed", "rfps", "bids"] },
  { kind: "nav", id: "nav-pipeline", group: "Navigate", icon: FolderKanban, label: "Pipeline", hint: "Page", to: "/pipeline", keywords: ["saved", "submitted", "drafts"] },
  { kind: "nav", id: "nav-bp", group: "Navigate", icon: UserSquare, label: "Business Profile", hint: "Page", to: "/business-profile", keywords: ["profile", "company", "sam", "naics"] },
  { kind: "nav", id: "nav-mentors", group: "Navigate", icon: MessagesSquare, label: "Mentors", hint: "Page", to: "/mentors", keywords: ["review", "advisor"] },
  { kind: "nav", id: "nav-gov-buyers", group: "Navigate", icon: Building2, label: "Government Buyers", hint: "Page", to: "/government-buyers", keywords: ["agencies", "usace", "navy", "sled", "contracting officer", "co", "sblo", "liaison", "people", "contact", "buyers"] },
  { kind: "nav", id: "nav-winners", group: "Navigate", icon: Trophy, label: "Who's Winning", hint: "Page", to: "/whos-winning", keywords: ["awards", "primes"] },
  { kind: "nav", id: "nav-partners", group: "Navigate", icon: Handshake, label: "Partners", hint: "Page", to: "/partners", keywords: ["partner finder", "teaming", "prime", "sub", "subcontract", "bd", "winners"] },
  { kind: "nav", id: "nav-forecasts", group: "Navigate", icon: CalendarRange, label: "Forecasts", hint: "Page", to: "/forecasts", keywords: ["anticipated", "upcoming", "track"] },
];

export const ICONS = { Search, Sparkles, Bookmark, Send };
