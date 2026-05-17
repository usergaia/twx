import { Construction } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonProps {
  feature: string;
  week?: number;
  description?: string;
}

export function ComingSoon({ feature, week, description }: ComingSoonProps) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Construction className="size-4" />
          <span className="text-xs uppercase tracking-wider">
            {week ? `Week ${week}` : "Coming soon"}
          </span>
        </div>
        <CardTitle className="text-lg">{feature}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is part of the roadmap and will be implemented in a future week.
      </CardContent>
    </Card>
  );
}
