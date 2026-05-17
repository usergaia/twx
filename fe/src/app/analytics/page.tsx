import { ComingSoon } from "@/components/common/coming-soon";
import { PageHeader } from "@/components/common/page-header";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" />
      <ComingSoon
        feature="Analytics dashboards"
        week={11}
        description="Embedded Metabase boards over PostgreSQL fleet data."
      />
    </div>
  );
}
