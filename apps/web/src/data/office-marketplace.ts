import { Building, Building2, Laptop, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface OfficeType {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const OFFICE_TYPES: OfficeType[] = [
  { id: "coworking", title: "Coworking", description: "Flexible desks in shared startup-friendly spaces.", icon: Users2 },
  { id: "private", title: "Private office", description: "Dedicated, lockable space for your growing team.", icon: Building },
  { id: "virtual", title: "Virtual office", description: "A registered business address without the overhead.", icon: Laptop },
  { id: "meeting", title: "Meeting rooms", description: "Book by the hour for pitches, interviews, and demos.", icon: Building2 },
];
