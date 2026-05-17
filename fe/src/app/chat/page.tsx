import { ComingSoon } from "@/components/common/coming-soon";
import { PageHeader } from "@/components/common/page-header";

export default function ChatPage() {
  return (
    <div>
      <PageHeader title="Chat & Notifications" />
      <ComingSoon
        feature="Real-time notifications & in-app chat"
        week={12}
        description="Driver/dispatcher chat plus n8n-driven notification triggers."
      />
    </div>
  );
}
