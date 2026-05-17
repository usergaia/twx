import { ComingSoon } from "@/components/common/coming-soon";
import { PageHeader } from "@/components/common/page-header";

export default function RoutesPage() {
  return (
    <div>
      <PageHeader title="Routes" />
      <ComingSoon
        feature="Route optimization"
        week={7}
        description="Shortest-path suggestions powered by the route optimizer service."
      />
    </div>
  );
}
