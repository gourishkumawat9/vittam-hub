/**
 * VittamHub's own icon set. See createIcon.tsx for the drawing rules and
 * docs/02-design-system.md ("Icons") for how to use and extend it.
 *
 * Names follow the ones the app used before, so a call site only changes its
 * import. There is deliberately no "sparkles" icon: it reads as machine-made.
 */
import { createIcon, Pt, Tint } from "./createIcon";

export { createIcon, Pt, Tint } from "./createIcon";
export type { Icon, Icon as IconComponent, IconProps } from "./createIcon";

/* ── Arrows and controls ─────────────────────────────────────────────── */

export const ArrowRight = createIcon("ArrowRight", <path d="M4 12h15M13 6l6 6-6 6" />);
export const ArrowLeft = createIcon("ArrowLeft", <path d="M20 12H5M11 6l-6 6 6 6" />);
export const ArrowDown = createIcon("ArrowDown", <path d="M12 4v15M6 13l6 6 6-6" />);
export const ChevronDown = createIcon("ChevronDown", <path d="M6 9.5l6 6 6-6" />);
export const ChevronRight = createIcon("ChevronRight", <path d="M9.5 6l6 6-6 6" />);
export const Check = createIcon("Check", <path d="M4.5 12.5l5 5L19.5 7" />);
export const CheckCheck = createIcon("CheckCheck", <path d="M2 12.5l5 5L16.5 8M11.5 16l1.5 1.5L22.5 8" />);
export const X = createIcon("X", <path d="M6 6l12 12M18 6L6 18" />);
export const Plus = createIcon("Plus", <path d="M12 5v14M5 12h14" />);
export const Minus = createIcon("Minus", <path d="M5 12h14" />);
export const Menu = createIcon("Menu", <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h11" />);
export const GripVertical = createIcon(
  "GripVertical",
  <>
    <Pt x={9} y={6} />
    <Pt x={15} y={6} />
    <Pt x={9} y={12} />
    <Pt x={15} y={12} />
    <Pt x={9} y={18} />
    <Pt x={15} y={18} />
  </>,
);
export const ExternalLink = createIcon("ExternalLink", <path d="M18.5 13.5v7h-15v-15h7M14 3.5h6.5V10M20.5 3.5l-9 9" />);
export const LogOut = createIcon("LogOut", <path d="M10 20.5H3.5v-17H10M16 7.5l4.5 4.5-4.5 4.5M20.5 12H9" />);
export const Upload = createIcon("Upload", 
  <>
    <Tint><path d="M3.5 15h17v5.5h-17z" /></Tint>
    <path d="M12 15.5V4M7.5 8.5L12 4l4.5 4.5M3.5 15v5.5h17V15" />
  </>,
);
export const Loader2 = createIcon("Loader2", <path d="M20.5 12A8.5 8.5 0 1 1 12 3.5" />);
export const Play = createIcon("Play", 
  <>
    <Tint><path d="M7 4.5v15L19 12z" /></Tint>
    <path d="M7 4.5v15L19 12z" />
  </>,
);
export const Pause = createIcon("Pause", 
  <>
    <Tint><path d="M6.5 5h3.5v14H6.5zM14 5h3.5v14H14z" /></Tint>
    <path d="M6.5 5h3.5v14H6.5zM14 5h3.5v14H14z" />
  </>,
);
export const PlayCircle = createIcon(
  "PlayCircle",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5v7l5.5-3.5z" />
  </>,
);
export const Search = createIcon(
  "Search",
  <>
    <Tint><circle cx="10.5" cy="10.5" r="6.5" /></Tint>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.25 15.25L21 21" />
  </>,
);
export const SearchCheck = createIcon(
  "SearchCheck",
  <>
    <Tint><circle cx="10.5" cy="10.5" r="6.5" /></Tint>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.25 15.25L21 21M7.75 10.5l2 2 3.5-3.5" />
  </>,
);
export const Pencil = createIcon("Pencil", 
  <>
    <Tint><path d="M15.5 4.5l4 4-11 11-5 1 1-5z" /></Tint>
    <path d="M15.5 4.5l4 4-11 11-5 1 1-5zM13 7l4 4" />
  </>,
);
export const Trash2 = createIcon("Trash2", 
  <>
    <Tint><path d="M5.75 6.5l1 14h10.5l1-14z" /></Tint>
    <path d="M3.5 6.5h17M9 6.5V3.5h6v3M5.75 6.5l1 14h10.5l1-14M10 10.5v6M14 10.5v6" />
  </>,
);
export const Settings = createIcon(
  "Settings",
  <>
    <Tint><circle cx="12" cy="12" r="7.4" /></Tint>
    <path d="M19.15 10.1l2.21.29v3.22l-2.21.29-.75 1.81 1.36 1.77-2.28 2.28-1.77-1.36-1.81.75-.29 2.21h-3.22l-.29-2.21-1.81-.75-1.77 1.36-2.28-2.28 1.36-1.77-.75-1.81-2.21-.29v-3.22l2.21-.29.75-1.81-1.36-1.77 2.28-2.28 1.77 1.36 1.81-.75.29-2.21h3.22l.29 2.21 1.81.75 1.77-1.36 2.28 2.28-1.36 1.77z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

/* ── Status ──────────────────────────────────────────────────────────── */

export const Circle = createIcon("Circle", <circle cx="12" cy="12" r="8.5" />);
export const CheckCircle2 = createIcon(
  "CheckCircle2",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M7.75 12.25l2.75 2.75 5.75-6" />
  </>,
);
export const XCircle = createIcon(
  "XCircle",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </>,
);
export const AlertCircle = createIcon(
  "AlertCircle",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6.5" />
    <Pt x={12} y={16.5} />
  </>,
);
export const Info = createIcon(
  "Info",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10.5V17" />
    <Pt x={12} y={7.5} />
  </>,
);
export const HelpCircle = createIcon(
  "HelpCircle",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.25c-.7.35-1.1.9-1.1 1.7v.55" />
    <Pt x={12} y={17} />
  </>,
);
export const AlertTriangle = createIcon(
  "AlertTriangle",
  <>
    <Tint><path d="M12 3.5l9.5 16.5h-19z" /></Tint>
    <path d="M12 3.5l9.5 16.5h-19z" />
    <path d="M12 9.5v5" />
    <Pt x={12} y={17.25} />
  </>,
);
export const CircleSlash = createIcon(
  "CircleSlash",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 15l6-6" />
  </>,
);
export const Ban = createIcon(
  "Ban",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.75 5.75l12.5 12.5" />
  </>,
);
export const Eye = createIcon(
  "Eye",
  <>
    <Tint><circle cx="12" cy="12" r="3" /></Tint>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const EyeOff = createIcon(
  "EyeOff",
  <path d="M9.9 5.75A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.4 7.4A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4.6-1.15M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" />,
);
export const Lock = createIcon("Lock", 
  <>
    <Tint><path d="M4.5 10.5h15v10h-15z" /></Tint>
    <path d="M4.5 10.5h15v10h-15zM8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.25v2.75" />
  </>,
);
export const KeyRound = createIcon(
  "KeyRound",
  <>
    <Tint><circle cx="8.5" cy="15.5" r="4.5" /></Tint>
    <circle cx="8.5" cy="15.5" r="4.5" />
    <path d="M11.7 12.3L20 4M16.5 7.5l3 3M14 10l2 2" />
  </>,
);
export const Shield = createIcon("Shield", 
  <>
    <Tint><path d="M12 3l8 3v5.5c0 5-3.4 8.4-8 9.75C7.4 19.9 4 16.5 4 11.5V6z" /></Tint>
    <path d="M12 3l8 3v5.5c0 5-3.4 8.4-8 9.75C7.4 19.9 4 16.5 4 11.5V6z" />
  </>,
);
export const ShieldCheck = createIcon("ShieldCheck", 
  <>
    <Tint><path d="M12 3l8 3v5.5c0 5-3.4 8.4-8 9.75C7.4 19.9 4 16.5 4 11.5V6z" /></Tint>
    <path d="M12 3l8 3v5.5c0 5-3.4 8.4-8 9.75C7.4 19.9 4 16.5 4 11.5V6zM8.5 12l2.5 2.5 4.5-4.75" />
  </>,
);
export const ShieldAlert = createIcon(
  "ShieldAlert",
  <>
    <Tint><path d="M12 3l8 3v5.5c0 5-3.4 8.4-8 9.75C7.4 19.9 4 16.5 4 11.5V6z" /></Tint>
    <path d="M12 3l8 3v5.5c0 5-3.4 8.4-8 9.75C7.4 19.9 4 16.5 4 11.5V6zM12 7.5v5.5" />
    <Pt x={12} y={15.75} />
  </>,
);
/** The verified seal: an octagon cut like the flared ends of the mark. */
export const BadgeCheck = createIcon("BadgeCheck", 
  <>
    <Tint><path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z" /></Tint>
    <path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7zM8.25 12l2.5 2.5 5-5.25" />
  </>,
);
export const Award = createIcon(
  "Award",
  <>
    <Tint><path d="M9.25 3.25h5.5l3.9 3.9v5.5l-3.9 3.9h-5.5l-3.9-3.9v-5.5z" /></Tint>
    <path d="M9.25 3.25h5.5l3.9 3.9v5.5l-3.9 3.9h-5.5l-3.9-3.9v-5.5z" />
    <path d="M8.75 16.5L7.5 21.5l4.5-2 4.5 2-1.25-5" />
  </>,
);
export const Star = createIcon("Star", 
  <>
    <Tint><path d="M12 3.35l2.35 6.01 6.45.38-5 4.1 1.64 6.24L12 16.6l-5.44 3.48 1.64-6.24-5-4.1 6.45-.38z" /></Tint>
    <path d="M12 3.35l2.35 6.01 6.45.38-5 4.1 1.64 6.24L12 16.6l-5.44 3.48 1.64-6.24-5-4.1 6.45-.38z" />
  </>,
);
export const Flag = createIcon("Flag", 
  <>
    <Tint><path d="M5 4h13l-2.75 4.5L18 13H5z" /></Tint>
    <path d="M5 21.5V3M5 4h13l-2.75 4.5L18 13H5" />
  </>,
);

/* ── People ──────────────────────────────────────────────────────────── */

export const User = createIcon(
  "User",
  <>
    <Tint><circle cx="12" cy="8" r="3.75" /></Tint>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20.5c.6-3.9 3.6-6 7.5-6s6.9 2.1 7.5 6" />
  </>,
);
export const UserRound = User;
export const UserCircle = createIcon(
  "UserCircle",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.4 18.4c1.2-1.95 3.2-3.05 5.6-3.05s4.4 1.1 5.6 3.05" />
  </>,
);
export const Users = createIcon(
  "Users",
  <>
    <Tint><circle cx="9" cy="8.5" r="3.25" /></Tint>
    <circle cx="9" cy="8.5" r="3.25" />
    <path d="M2.75 20c.5-3.4 2.9-5.25 6.25-5.25S14.75 16.6 15.25 20M15 5.4a3.25 3.25 0 0 1 0 6.2M17.5 14.9c2.1.6 3.4 2.3 3.75 5.1" />
  </>,
);
export const Users2 = Users;
export const UserPlus = createIcon(
  "UserPlus",
  <>
    <Tint><circle cx="10" cy="8" r="3.5" /></Tint>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3 20c.6-3.7 3.3-5.5 7-5.5s6.4 1.8 7 5.5M19 7v6M16 10h6" />
  </>,
);
export const UserCheck = createIcon(
  "UserCheck",
  <>
    <Tint><circle cx="10" cy="8" r="3.5" /></Tint>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3 20c.6-3.7 3.3-5.5 7-5.5s6.4 1.8 7 5.5M15.5 10.5l2 2 4.5-4.5" />
  </>,
);
export const IdCard = createIcon(
  "IdCard",
  <>
    <Tint><path d="M2.5 5h19v14h-19z" /></Tint>
    <path d="M2.5 5h19v14h-19z" />
    <circle cx="8.5" cy="10.5" r="2" />
    <path d="M5.25 16c.5-1.4 1.6-2.25 3.25-2.25s2.75.85 3.25 2.25M14.5 9.5h4M14.5 13h4" />
  </>,
);

/* ── Places and organisations ────────────────────────────────────────── */

export const Building = createIcon("Building", 
  <>
    <Tint><path d="M4.5 3h15v18h-15z" /></Tint>
    <path d="M4.5 21V3h15v18M2.5 21h19M8.5 7h2M13.5 7h2M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2M10.5 21v-3h3v3" />
  </>,
);
export const Building2 = createIcon("Building2", 
  <>
    <Tint><path d="M14 9h6v12h-6z" /></Tint>
    <path d="M4 21V3.5h10V21M14 9h6v12M2.5 21h19M7 7.5h4M7 11h4M7 14.5h4M16.5 12.5H18M16.5 16H18M8 21v-3h2v3" />
  </>,
);
export const Landmark = createIcon("Landmark", 
  <>
    <Tint><path d="M3 9h18L12 3.5z" /></Tint>
    <path d="M3 9h18L12 3.5zM5.5 9v8.5M10 9v8.5M14 9v8.5M18.5 9v8.5M3.5 17.5h17M2.5 20.5h19" />
  </>,
);
export const School = createIcon(
  "School",
  <>
    <Tint><path d="M8 21V8.5l4-3.5 4 3.5V21z" /></Tint>
    <path d="M2.5 21h19M4 21v-8.5h4M20 21v-8.5h-4M8 21V8.5l4-3.5 4 3.5V21M10.5 21v-4h3v4" />
    <circle cx="12" cy="11" r="1.5" />
  </>,
);
export const GraduationCap = createIcon("GraduationCap", 
  <>
    <Tint><path d="M12 4.5L2 9.5l10 5 10-5z" /></Tint>
    <path d="M12 4.5L2 9.5l10 5 10-5zM6 11.5v5c1.7 1.5 3.8 2.25 6 2.25s4.3-.75 6-2.25v-5M22 9.5v6" />
  </>,
);
export const Briefcase = createIcon("Briefcase", 
  <>
    <Tint><path d="M3 7h18v5.5H3z" /></Tint>
    <path d="M3 7h18v13H3zM8.5 7V4h7v3M3 12.5h18" />
  </>,
);
export const MapPin = createIcon(
  "MapPin",
  <>
    <Tint><path d="M12 21.5s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z" /></Tint>
    <path d="M12 21.5s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </>,
);
export const Globe = createIcon(
  "Globe",
  <>
    <Tint><path d="M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3z" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3z" />
  </>,
);
export const Compass = createIcon(
  "Compass",
  <>
    <Tint><path d="M15.75 8.25l-2 5.5-5.5 2 2-5.5z" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.75 8.25l-2 5.5-5.5 2 2-5.5z" />
  </>,
);

/* ── Time ────────────────────────────────────────────────────────────── */

const CAL = "M3.5 5h17v15.5h-17zM3.5 9.5h17M8 3v4M16 3v4";
export const Calendar = createIcon("Calendar", 
  <>
    <Tint><path d="M3.5 5h17v4.5h-17z" /></Tint>
    <path d={CAL} />
  </>,
);
export const CalendarDays = createIcon(
  "CalendarDays",
  <>
    <Tint><path d="M3.5 5h17v4.5h-17z" /></Tint>
    <path d={CAL} />
    <Pt x={8} y={13.25} />
    <Pt x={12} y={13.25} />
    <Pt x={16} y={13.25} />
    <Pt x={8} y={16.75} />
    <Pt x={12} y={16.75} />
  </>,
);
export const CalendarPlus = createIcon("CalendarPlus", 
  <>
    <Tint><path d="M3.5 5h17v4.5h-17z" /></Tint>
    <path d={`${CAL}M12 12v6M9 15h6`} />
  </>,
);
export const CalendarRange = createIcon("CalendarRange", 
  <>
    <Tint><path d="M3.5 5h17v4.5h-17z" /></Tint>
    <path d={`${CAL}M7 13.25h6.5M10.5 16.75H17`} />
  </>,
);
export const CalendarClock = createIcon(
  "CalendarClock",
  <>
    <Tint><circle cx="17" cy="17" r="4.5" /></Tint>
    <path d="M10.5 20.5h-7V5h17v5M3.5 9.5h17M8 3v4M16 3v4" />
    <circle cx="17" cy="17" r="4.5" />
    <path d="M17 14.75V17l1.75 1.25" />
  </>,
);
export const Clock = createIcon(
  "Clock",
  <>
    <Tint><circle cx="12" cy="12" r="9" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2.25" />
  </>,
);
export const History = createIcon("History", <path d="M4 12a8 8 0 1 0 2.34-5.66M10 6.34H6.34V2.68M12 8v4l2.75 2" />);
export const Gauge = createIcon("Gauge", 
  <>
    <Tint><path d="M3.5 17.5a8.5 8.5 0 1 1 17 0z" /></Tint>
    <path d="M3.5 17.5a8.5 8.5 0 1 1 17 0M12 16l4-5.5M3.5 17.5h3M17.5 17.5h3" />
  </>,
);

/* ── Documents and content ───────────────────────────────────────────── */

export const FileText = createIcon("FileText", 
  <>
    <Tint><path d="M14 3v4.5h4.5z" /></Tint>
    <path d="M5.5 3h8.5l4.5 4.5V21h-13zM14 3v4.5h4.5M8.5 12.5h7M8.5 16h7M8.5 9h2.5" />
  </>,
);
export const ClipboardList = createIcon(
  "ClipboardList",
  <>
    <Tint><path d="M8 3h8v3H8z" /></Tint>
    <path d="M8 4.5H5v16.5h14V4.5h-3M8 3h8v3H8zM11 11h5M11 15.5h5" />
    <Pt x={8.5} y={11} />
    <Pt x={8.5} y={15.5} />
  </>,
);
export const Inbox = createIcon("Inbox", 
  <>
    <Tint><path d="M3 13.5h5l1 2.5h6l1-2.5h5V20H3z" /></Tint>
    <path d="M3 13.5L5.5 5h13l2.5 8.5V20H3zM3 13.5h5l1 2.5h6l1-2.5h5" />
  </>,
);
export const FolderLock = createIcon("FolderLock", 
  <>
    <Tint><path d="M14 15h7v5.5h-7z" /></Tint>
    <path d="M10.5 19.5H3v-15h6l2 2.5h10v4M14 15h7v5.5h-7zM15.75 15v-1.5a1.75 1.75 0 0 1 3.5 0V15" />
  </>,
);
export const BookOpen = createIcon("BookOpen", 
  <>
    <Tint><path d="M12 6.5C10 5 7 4.5 3 4.5v14c4 0 7 .5 9 2z" /></Tint>
    <path d="M12 6.5C10 5 7 4.5 3 4.5v14c4 0 7 .5 9 2 2-1.5 5-2 9-2v-14c-4 0-7 .5-9 2zM12 6.5v14" />
  </>,
);
export const Bookmark = createIcon("Bookmark", 
  <>
    <Tint><path d="M6.5 3.5h11v17L12 16l-5.5 4.5z" /></Tint>
    <path d="M6.5 3.5h11v17L12 16l-5.5 4.5z" />
  </>,
);
export const BookmarkCheck = createIcon("BookmarkCheck", 
  <>
    <Tint><path d="M6.5 3.5h11v17L12 16l-5.5 4.5z" /></Tint>
    <path d="M6.5 3.5h11v17L12 16l-5.5 4.5zM9.25 9.5l2 2 3.5-3.75" />
  </>,
);
export const Layers = createIcon("Layers", 
  <>
    <Tint><path d="M12 3l9 4.75-9 4.75-9-4.75z" /></Tint>
    <path d="M12 3l9 4.75-9 4.75-9-4.75zM3 12l9 4.75L21 12M3 16.25L12 21l9-4.75" />
  </>,
);
export const ListTree = createIcon("ListTree", <path d="M3.5 4.5h7M6.5 4.5v14h4M6.5 11.5h4M13.5 4.5h7M13.5 11.5h7M13.5 18.5h7" />);
export const Kanban = createIcon("Kanban", 
  <>
    <Tint><path d="M3.5 3.5h17v17h-17z" /></Tint>
    <path d="M3.5 3.5h17v17h-17zM8 7.5v8.5M12 7.5V12M16 7.5v10" />
  </>,
);
export const LayoutDashboard = createIcon("LayoutDashboard", 
  <>
    <Tint><path d="M13.5 3.5h7v5h-7zM3.5 15.5h7v5h-7z" /></Tint>
    <path d="M3.5 3.5h7v9h-7zM13.5 3.5h7v5h-7zM13.5 11.5h7v9h-7zM3.5 15.5h7v5h-7z" />
  </>,
);
export const Palette = createIcon(
  "Palette",
  <>
    <Tint><path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2 0-1.5-1.5-2-1.5-3.25 0-1 .8-1.75 1.75-1.75H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" /></Tint>
    <path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2 0-1.5-1.5-2-1.5-3.25 0-1 .8-1.75 1.75-1.75H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" />
    <Pt x={7.5} y={11} />
    <Pt x={9.5} y={7} />
    <Pt x={14.5} y={7} />
  </>,
);

/* ── Charts and progress ─────────────────────────────────────────────── */

export const Activity = createIcon("Activity", <path d="M2.5 12h4l3-7.5 5 15 3-7.5h4" />);
export const TrendingUp = createIcon("TrendingUp", <path d="M2.5 17.5l6.5-6.5 4 4 8-8M15 7h6v6" />);
export const LineChart = createIcon("LineChart", 
  <>
    <Tint><path d="M7.5 15l3.5-4.5 3 2.5 5-6v13.5h-11.5z" /></Tint>
    <path d="M3.5 3.5v17h17M7.5 15l3.5-4.5 3 2.5 5-6" />
  </>,
);
export const BarChart3 = createIcon("BarChart3", 
  <>
    <Tint><path d="M12.5 7.5V17" /></Tint>
    <path d="M3.5 3.5v17h17M8 17v-4.5M12.5 17V7.5M17 17v-6.5" />
  </>,
);
export const PieChart = createIcon("PieChart", 
  <>
    <Tint><path d="M15 2.75V9h6.25A6.25 6.25 0 0 0 15 2.75z" /></Tint>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12zM15 2.75V9h6.25A6.25 6.25 0 0 0 15 2.75z" />
  </>,
);
export const Target = createIcon(
  "Target",
  <>
    <Tint><circle cx="12" cy="12" r="5" /></Tint>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <Pt x={12} y={12} s={2.5} />
  </>,
);
export const Network = createIcon("Network", 
  <>
    <Tint><path d="M9 2.5h6v5H9z" /></Tint>
    <path d="M9 2.5h6v5H9zM2.5 16.5h6v5h-6zM15.5 16.5h6v5h-6zM12 7.5V12M5.5 16.5V12h13v4.5" />
  </>,
);

/* ── Messages and notifications ──────────────────────────────────────── */

export const MessageCircle = createIcon("MessageCircle", 
  <>
    <Tint><path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.55L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" /></Tint>
    <path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.55L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" />
  </>,
);
export const MessageSquare = createIcon("MessageSquare", 
  <>
    <Tint><path d="M3.5 4.5h17v12H9l-5.5 4.5z" /></Tint>
    <path d="M3.5 4.5h17v12H9l-5.5 4.5z" />
  </>,
);
export const MessageSquareText = createIcon("MessageSquareText", 
  <>
    <Tint><path d="M3.5 4.5h17v12H9l-5.5 4.5z" /></Tint>
    <path d="M3.5 4.5h17v12H9l-5.5 4.5zM7.5 9h9M7.5 12.5h6" />
  </>,
);
export const MessageSquareReply = createIcon("MessageSquareReply", 
  <>
    <Tint><path d="M3.5 4.5h17v12H9l-5.5 4.5z" /></Tint>
    <path d="M3.5 4.5h17v12H9l-5.5 4.5zM10.5 7.5L7.5 10l3 2.5M7.5 10H13a3 3 0 0 1 3 3" />
  </>,
);
export const Send = createIcon("Send", 
  <>
    <Tint><path d="M21 3l-6.5 18-4-7.5L3 9.5z" /></Tint>
    <path d="M21 3L10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z" />
  </>,
);
export const MailCheck = createIcon("MailCheck", 
  <>
    <Tint><path d="M3 5h18v7.5L12 12 3 5.5z" /></Tint>
    <path d="M21 12.5V5H3v14h9.5M3 5.5l9 6.5 9-6.5M15 18l2 2 4.5-4.5" />
  </>,
);
export const Bell = createIcon("Bell", 
  <>
    <Tint><path d="M6 16.5V10a6 6 0 0 1 12 0v6.5l1.5 2h-15z" /></Tint>
    <path d="M6 16.5V10a6 6 0 0 1 12 0v6.5l1.5 2h-15zM10 21h4" />
  </>,
);
export const BellRing = createIcon("BellRing", 
  <>
    <Tint><path d="M6 16.5V10a6 6 0 0 1 12 0v6.5l1.5 2h-15z" /></Tint>
    <path d="M6 16.5V10a6 6 0 0 1 12 0v6.5l1.5 2h-15zM10 21h4M2.5 9c.3-2 1.2-3.7 2.7-5M21.5 9c-.3-2-1.2-3.7-2.7-5" />
  </>,
);
export const BellOff = createIcon("BellOff", <path d="M8.3 4.9A6 6 0 0 1 18 10v4.5M18 18.5H4.5l1.5-2V10a6 6 0 0 1 .4-2.1M10 21h4M3.5 3.5l17 17" />);
export const Megaphone = createIcon("Megaphone", 
  <>
    <Tint><path d="M7.5 9.5l10-5v15l-10-5z" /></Tint>
    <path d="M3.5 9.5h4l10-5v15l-10-5h-4zM7.5 9.5v5M8 14.5l1.5 5.5h3l-1.25-4.4M20 10v4" />
  </>,
);
export const Rss = createIcon(
  "Rss",
  <>
    <path d="M4.5 11.5a8 8 0 0 1 8 8M4.5 4.5a15 15 0 0 1 15 15" />
    <Pt x={5.5} y={18.5} s={2.5} />
  </>,
);
export const Link2 = createIcon("Link2", <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />);

/* ── Devices and media ───────────────────────────────────────────────── */

export const Laptop = createIcon("Laptop", 
  <>
    <Tint><path d="M4.5 5h15v10.5h-15z" /></Tint>
    <path d="M4.5 5h15v10.5h-15zM2 19.5h20" />
  </>,
);
export const MonitorSmartphone = createIcon("MonitorSmartphone", 
  <>
    <Tint><path d="M16 10h6v10.5h-6z" /></Tint>
    <path d="M18 8V4.5H2.5v11H13M6 19.5h7M9.5 15.5v4M16 10h6v10.5h-6z" />
  </>,
);
export const Video = createIcon("Video", 
  <>
    <Tint><path d="M2.5 6h13v12h-13z" /></Tint>
    <path d="M2.5 6h13v12h-13zM15.5 10.5l6-3.5v10l-6-3.5" />
  </>,
);
export const Camera = createIcon(
  "Camera",
  <>
    <Tint><circle cx="12" cy="13.5" r="3.75" /></Tint>
    <path d="M3 7.5h4l1.75-3h6.5L17 7.5h4V20H3z" />
    <circle cx="12" cy="13.5" r="3.75" />
  </>,
);
export const Cloud = createIcon("Cloud", 
  <>
    <Tint><path d="M7 19h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.6 4.75 4.75 0 0 0 7 19z" /></Tint>
    <path d="M7 19h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.6 4.75 4.75 0 0 0 7 19z" />
  </>,
);
export const CloudOff = createIcon("CloudOff", <path d="M7 19h12M20.8 16.4a4 4 0 0 0-2.7-5.35A6 6 0 0 0 9.2 6.3M6.3 9.7A4.75 4.75 0 0 0 7 19M3.5 3.5l17 17" />);
export const Sun = createIcon(
  "Sun",
  <>
    <Tint><circle cx="12" cy="12" r="4" /></Tint>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.25M12 19.25v2.25M2.5 12h2.25M19.25 12h2.25M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
  </>,
);
export const Moon = createIcon("Moon", 
  <>
    <Tint><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></Tint>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </>,
);
export const Languages = createIcon("Languages", <path d="M3 5.5h9M7.5 3v2.5M10 5.5c-.8 3.6-3 6.6-6.5 8.5M5.5 9c1 2 2.6 3.6 4.5 4.5M12.5 21l4-10 4 10M14 17.5h5" />);

/* ── Things founders and investors deal in ───────────────────────────── */

export const Wallet = createIcon("Wallet", 
  <>
    <Tint><path d="M3.5 7.5h17v13h-15a2 2 0 0 1-2-2z" /></Tint>
    <path d="M17.5 7.5v-4h-12a2 2 0 0 0 0 4h15v13h-15a2 2 0 0 1-2-2v-13M15 14h2.5" />
  </>,
);
export const Lightbulb = createIcon("Lightbulb", 
  <>
    <Tint><path d="M9 17.5c0-2-3.5-3.5-3.5-7.5a6.5 6.5 0 0 1 13 0c0 4-3.5 5.5-3.5 7.5z" /></Tint>
    <path d="M9 17.5h6M10 21h4M9 17.5c0-2-3.5-3.5-3.5-7.5a6.5 6.5 0 0 1 13 0c0 4-3.5 5.5-3.5 7.5" />
  </>,
);
export const Rocket = createIcon(
  "Rocket",
  <>
    <Tint><path d="M12 2.5c3 2.5 4.5 6 4.5 10.5l-1.5 3.5H9L7.5 13C7.5 8.5 9 5 12 2.5z" /></Tint>
    <path d="M12 2.5c3 2.5 4.5 6 4.5 10.5l-1.5 3.5H9L7.5 13C7.5 8.5 9 5 12 2.5zM7.6 12L4.5 15v4.5l4-2M16.4 12l3.1 3v4.5l-4-2M10.5 19.5L12 22l1.5-2.5" />
    <circle cx="12" cy="9" r="1.75" />
  </>,
);
/** A connect request: one request out, one answer back. */
export const Handshake = createIcon("Handshake", <path d="M3 8h14.5M13.5 4l4 4-4 4M21 16H6.5M10.5 12l-4 4 4 4" />);
export const Heart = createIcon("Heart", 
  <>
    <Tint><path d="M12 20.5S3 15 3 8.75A4.75 4.75 0 0 1 12 6.5a4.75 4.75 0 0 1 9 2.25C21 15 12 20.5 12 20.5z" /></Tint>
    <path d="M12 20.5S3 15 3 8.75A4.75 4.75 0 0 1 12 6.5a4.75 4.75 0 0 1 9 2.25C21 15 12 20.5 12 20.5z" />
  </>,
);
export const HeartHandshake = createIcon("HeartHandshake", 
  <>
    <Tint><path d="M12 20.5S3 15 3 8.75A4.75 4.75 0 0 1 12 6.5a4.75 4.75 0 0 1 9 2.25C21 15 12 20.5 12 20.5z" /></Tint>
    <path d="M12 20.5S3 15 3 8.75A4.75 4.75 0 0 1 12 6.5a4.75 4.75 0 0 1 9 2.25C21 15 12 20.5 12 20.5zM8.25 12l2.5 2.5 4.75-5" />
  </>,
);

/* ── Brand marks (monochrome, for sign-in buttons only) ──────────────── */

export const Github = createIcon(
  "Github",
  <path
    transform="translate(2 2) scale(1.25)"
    fill="currentColor"
    stroke="none"
    d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
  />,
);
export const Linkedin = createIcon(
  "Linkedin",
  <>
    <path d="M3.5 3.5h17v17h-17zM7.75 10.5V17M11 17v-6.5M11 13.5c0-1.75 1-3 2.6-3s2.65 1.25 2.65 3V17" />
    <Pt x={7.75} y={7.5} />
  </>,
);
