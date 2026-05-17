import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { navItems } from "@/components/layout/nav-items";

export default function DashboardPage() {
  const ready = navItems.filter((i) => i.ready && i.href !== "/dashboard");
  const upcoming = navItems.filter((i) => !i.ready);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Smart Logistics Platform — implemented modules and roadmap."
      />

      <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Available now
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ready.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <Card className="transition-colors hover:bg-accent/40">
                <CardHeader>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>Open module</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Roadmap
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcoming.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="opacity-70">
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" />
                  {item.week && (
                    <span className="text-xs uppercase tracking-wider">Week {item.week}</span>
                  )}
                </div>
                <CardTitle>{item.label}</CardTitle>
                <CardDescription>Planned</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
