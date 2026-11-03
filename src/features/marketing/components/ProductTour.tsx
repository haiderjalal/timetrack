import { TabSwitcher } from "@/components/shared/TabSwitcher";

import { AdminLivePreview } from "./AdminLivePreview";
import { MemberWeekPreview } from "./MemberWeekPreview";
import { SectionHeading } from "./SectionHeading";

export function ProductTour() {
  return (
    <section
      id="tour"
      aria-labelledby="tour-title"
      className="mx-auto flex w-full max-w-6xl scroll-mt-20 flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8"
    >
      <SectionHeading
        id="tour-title"
        eyebrow="Product tour"
        title="One app, two views"
        description="Members see their own day. Owners and admins see the whole team, live, and get the month-end report without a spreadsheet."
        align="center"
      />
      <div className="reveal">
        <TabSwitcher
          label="Product tour"
          tabs={[
            {
              id: "member",
              label: "For members",
              panel: <MemberWeekPreview />,
            },
            {
              id: "admin",
              label: "For owners & admins",
              panel: <AdminLivePreview />,
            },
          ]}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Sample data shown.
      </p>
    </section>
  );
}
