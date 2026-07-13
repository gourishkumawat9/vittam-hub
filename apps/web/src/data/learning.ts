import { BookOpen, Briefcase, Landmark, Megaphone, Scale, ShoppingCart, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  lessons: number;
  progress: number; // 0-100, illustrative
  icon: LucideIcon;
}

export const LEARNING_TRACKS: LearningTrack[] = [
  { id: "basics", title: "Startup Basics", description: "Validate an idea and structure your founding team.", lessons: 12, progress: 0, icon: BookOpen },
  { id: "fundraising", title: "Fundraising", description: "Cap tables, term sheets, and investor outreach.", lessons: 16, progress: 0, icon: Landmark },
  { id: "marketing", title: "Marketing", description: "Positioning, channels, and early growth loops.", lessons: 10, progress: 0, icon: Megaphone },
  { id: "finance", title: "Finance", description: "Runway planning, unit economics, forecasting.", lessons: 14, progress: 0, icon: Briefcase },
  { id: "legal", title: "Legal", description: "Incorporation, equity, and compliance basics.", lessons: 9, progress: 0, icon: Scale },
  { id: "product", title: "Product", description: "Roadmapping, MVP scope, and user research.", lessons: 13, progress: 0, icon: Wrench },
  { id: "sales", title: "Sales", description: "Pipeline building and closing your first customers.", lessons: 11, progress: 0, icon: ShoppingCart },
];
