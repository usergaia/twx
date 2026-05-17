import { ComingSoon } from "@/components/common/coming-soon";
import { PageHeader } from "@/components/common/page-header";

export default function MapsPage() {
  return (
    <div>
      <PageHeader title="Maps" />
      <ComingSoon
        feature="GPS tracking & maps"
        week={6}
        description="Leaflet map with live driver positions and delivery markers."
      />
    </div>
  );
}
