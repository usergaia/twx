import { ComingSoon } from "@/components/common/coming-soon";
import { PageHeader } from "@/components/common/page-header";

export default function AgentsPage() {
  return (
    <div>
      <PageHeader title="AI Agents" />
      <ComingSoon
        feature="AI Agents (Route, Behavior, Alert)"
        week={10}
        description="LLM-backed agents that act on driver, route, and alert decisions."
      />
    </div>
  );
}
