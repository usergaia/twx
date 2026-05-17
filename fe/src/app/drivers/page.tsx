import { ComingSoon } from "@/components/common/coming-soon";
import { PageHeader } from "@/components/common/page-header";

export default function DriversPage() {
  return (
    <div>
      <PageHeader title="Drivers" />
      <ComingSoon
        feature="Driver list & CRUD"
        week={5}
        description="Driver registry backed by the Laravel API."
      />
    </div>
  );
}
