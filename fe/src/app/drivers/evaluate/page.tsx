"use client";

import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverEvaluateForm } from "@/components/forms/driver-evaluate-form";
import { ResultCard } from "@/components/common/result-card";
import { PageHeader } from "@/components/common/page-header";
import type { EvaluationResult } from "@/types";

export default function DriverEvaluatePage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);

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
            <DriverEvaluateForm onResult={setResult} />
          </CardContent>
        </Card>

        <div>
          {result ? (
            <ResultCard result={result} />
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
