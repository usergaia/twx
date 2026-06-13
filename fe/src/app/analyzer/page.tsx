"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import { RISK_LEVEL_LABELS, type RiskLevel, type TextAnalysis } from "@/types";

const RISK_STYLES: Record<RiskLevel, string> = {
  safe: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  moderate_risk:
    "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  high_risk: "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
};

const SAMPLE_LOG =
  "Driver accelerated rapidly at the intersection, hard braking detected near the checkpoint, and consistent speeding on the highway segment.";

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (typeof err.body === "object" && err.body !== null && "detail" in err.body) {
      const detail = (err.body as { detail: unknown }).detail;
      return typeof detail === "string" ? detail : JSON.stringify(detail);
    }
    return err.message;
  }
  return (err as Error).message;
}

export default function AnalyzerPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<TextAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAnalyzing(true);
    try {
      const data = await aiClient.analyzeText(trimmed);
      setResult(data);
      toast.success(`Classified as ${RISK_LEVEL_LABELS[data.risk_level]}`);
    } catch (err) {
      toast.error(`Analysis failed: ${describeError(err)}`);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Text Analyzer"
        description="Classify a free-text driver behavior log or incident report with a local LLM (Ollama, via function calling). Hits POST /analyze on the FastAPI service."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Behavior log</CardTitle>
            <CardDescription>
              Paste a driver report, incident note, or behavior log. The model
              classifies overall risk and explains why.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Hard braking near the checkpoint and consistent speeding on the highway."
              rows={6}
              maxLength={5000}
              disabled={analyzing}
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleAnalyze} disabled={!text.trim() || analyzing}>
                {analyzing && <Loader2 className="mr-2 size-4 animate-spin" />}
                Analyze
              </Button>
              <Button
                variant="outline"
                onClick={() => setText(SAMPLE_LOG)}
                disabled={analyzing}
              >
                Use sample
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          {result ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">Risk assessment</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      via {result.model}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ring-1",
                      RISK_STYLES[result.risk_level],
                    )}
                  >
                    {RISK_LEVEL_LABELS[result.risk_level]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                    Explanation
                  </div>
                  <p className="text-sm">{result.explanation}</p>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Risk factors
                  </div>
                  {result.risk_factors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      None identified.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {result.risk_factors.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Analyzed at {new Date(result.timestamp).toLocaleString()}
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>
                  Submit a log to classify it. Results appear here and append to{" "}
                  <code className="text-xs">db/analyses.json</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                No analysis yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
