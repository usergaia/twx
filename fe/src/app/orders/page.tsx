import { ComingSoon } from "@/components/common/coming-soon";
import { PageHeader } from "@/components/common/page-header";

export default function OrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" />
      <ComingSoon
        feature="Order management"
        week={5}
        description="Create orders, assign drivers and vehicles, monitor status."
      />
    </div>
  );
}
