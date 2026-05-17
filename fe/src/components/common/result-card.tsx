import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import type { EvaluationResult } from "@/types";

export function ResultCard({ result }: { result: EvaluationResult }) {
  const noAlerts = result.alerts.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{result.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{result.location}</p>
          </div>
          <StatusBadge status={result.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
          <div className="text-5xl font-semibold tabular-nums">{result.score}</div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Alerts</div>
          {noAlerts ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
              No issues detected
            </div>
          ) : (
            <ul className="space-y-1.5">
              {result.alerts.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Evaluated at {new Date(result.timestamp).toLocaleString()}
      </CardFooter>
    </Card>
  );
}
