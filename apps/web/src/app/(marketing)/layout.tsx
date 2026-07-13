import { Footer } from "@/components/marketing/Footer";
import { NavBar } from "@/components/marketing/NavBar";

/**
 * Public marketing shell: home, pricing, about, startup/investor directories
 * (public profile pages), blog. No auth required. Route group keeps this
 * layout (nav + footer) isolated from the dashboard chrome.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
