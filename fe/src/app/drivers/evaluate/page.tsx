"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverEvaluateForm } from "@/components/forms/driver-evaluate-form";
import { ResultCard } from "@/components/common/result-card";
import { IncidentReportCard } from "@/components/common/incident-report-card";
import { PageHeader } from "@/components/common/page-header";
import { aiClient } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import type { DriverInput, EvaluationResult, IncidentReport } from "@/types";

export default function DriverEvaluatePage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [input, setInput] = useState<DriverInput | null>(null);
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [generating, setGenerating] = useState(false);

  function handleResult(r: EvaluationResult, i: DriverInput) {
    setResult(r);
    setInput(i);
    setReport(null); // clear any stale report from a prior evaluation
  }

  async function handleGenerateReport() {
    if (!result || !input) return;
    setGenerating(true);
    try {
      const data = await aiClient.generateReport({
        ...input,
        alerts: result.alerts,
        score: result.score,
        status: result.status,
      });
      setReport(data);
      toast.success("Incident report generated");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : (err as Error).message;
      toast.error(`Report generation failed: ${message}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Driver Evaluation"
        description="Score a driver against the rule-based safety engine. Calls the FastAPI service at NEXT_PUBLIC_AI_URL."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Driver telemetry</CardTitle>
            <CardDescription>
              Enter current driver state. Speed, fuel, temperature, route, and weather drive the score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriverEvaluateForm onResult={handleResult} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result ? (
            <>
              <ResultCard result={result} />
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">AI incident report</CardTitle>
                      <CardDescription>
                        Have the LLM narrate this evaluation into a written report with recommendations. Needs Ollama running.
                      </CardDescription>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={generating}>
                      {generating && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Generate report
                    </Button>
                  </div>
                </CardHeader>
                {report && (
                  <CardContent>
                    <IncidentReportCard report={report} />
                  </CardContent>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>
                  Submit the form to evaluate a driver. Results appear here and append to{" "}
                  <code className="text-xs">db/results.json</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                No evaluation yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
