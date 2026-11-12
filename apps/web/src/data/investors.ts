export interface InvestorCard {
  id: string;
  name: string;
  firm: string;
  initials: string;
  ticketSize: string;
  industries: string[];
  portfolioCount: number;
  openForPitches: boolean;
}

/** Illustrative placeholder profiles — not real firms or individuals. */
export const FEATURED_INVESTORS: InvestorCard[] = [
  {
    id: "1",
    name: "Maya Chen",
    firm: "Northlight Ventures",
    initials: "MC",
    ticketSize: "$100K – $1M",
    industries: ["FinTech", "SaaS"],
    portfolioCount: 24,
    openForPitches: true,
  },
  {
    id: "2",
    name: "Daniel Ofori",
    firm: "Baobab Capital",
    initials: "DO",
    ticketSize: "$250K – $2M",
    industries: ["AgriTech", "ClimateTech"],
    portfolioCount: 17,
    openForPitches: true,
  },
  {
    id: "3",
    name: "Priya Nair",
    firm: "Meridian Angels",
    initials: "PN",
    ticketSize: "$25K – $250K",
    industries: ["HealthTech", "EdTech"],
    portfolioCount: 41,
    openForPitches: false,
  },
  {
    id: "4",
    name: "Lucas Ferreira",
    firm: "Andina Fund",
    initials: "LF",
    ticketSize: "$500K – $5M",
    industries: ["Logistics", "Marketplaces"],
    portfolioCount: 12,
    openForPitches: true,
  },
];
