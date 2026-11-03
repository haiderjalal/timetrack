import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1 bg-canvas">{children}</main>
      <MarketingFooter />
    </>
  );
}
