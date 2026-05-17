"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { ResultCard } from "@/components/common/result-card";
import { aiClient } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import type { DriverInput, EvaluationResult } from "@/types";

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (
      typeof err.body === "object" &&
      err.body !== null &&
      "detail" in err.body
    ) {
      const detail = (err.body as { detail: unknown }).detail;
      return typeof detail === "string" ? detail : JSON.stringify(detail);
    }
    return err.message;
  }
  return (err as Error).message;
}

export default function DriversBatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<DriverInput[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const data = await aiClient.getDriversBatch();
      setRows(data);
    } catch (err) {
      toast.error(`Failed to load dataset: ${describeError(err)}`);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    aiClient
      .getDriversBatch()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(`Failed to load dataset: ${describeError(err)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const res = await aiClient.uploadDriversBatch(file);
      toast.success(`Uploaded ${res.row_count} rows from ${res.filename}`);
      setFile(null);
      await refresh();
    } catch (err) {
      toast.error(`Upload failed: ${describeError(err)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleEvaluate() {
    setEvaluating(true);
    try {
      const data = await aiClient.evaluateDriversBatch();
      setResults(data);
      toast.success(`Evaluated ${data.length} drivers`);
    } catch (err) {
      toast.error(`Evaluation failed: ${describeError(err)}`);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Batch Driver Evaluation"
        description="Upload a CSV of drivers, preview the dataset, and score them all in one pass. Hits the /drivers/batch endpoints on the FastAPI service at NEXT_PUBLIC_AI_URL."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload dataset</CardTitle>
            <CardDescription>
              CSV columns must match the DriverInput model. Required: name, location, speed. Optional with defaults: route, weather, fuel, temperature, fatigue. Replaces the current dataset on success.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
                className="max-w-md"
              />
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Current dataset</CardTitle>
                <CardDescription>
                  {rows.length === 0
                    ? "No dataset uploaded yet."
                    : `${rows.length} driver${rows.length === 1 ? "" : "s"} stored at ai/data/drivers.csv.`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={refreshing}
              >
                {refreshing && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Upload a CSV to populate the dataset.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Location</th>
                      <th className="py-2 pr-3">Speed</th>
                      <th className="py-2 pr-3">Weather</th>
                      <th className="py-2 pr-3">Route</th>
                      <th className="py-2 pr-3">Fuel</th>
                      <th className="py-2 pr-3">Temp</th>
                      <th className="py-2 pr-3">Fatigue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.name}-${i}`} className="border-b last:border-0">
                        <td className="py-2 pr-3">{r.name}</td>
                        <td className="py-2 pr-3">{r.location}</td>
                        <td className="py-2 pr-3 tabular-nums">{r.speed}</td>
                        <td className="py-2 pr-3">{r.weather}</td>
                        <td className="py-2 pr-3">{r.route || "—"}</td>
                        <td className="py-2 pr-3 tabular-nums">{r.fuel}</td>
                        <td className="py-2 pr-3 tabular-nums">{r.temperature}</td>
                        <td className="py-2 pr-3 tabular-nums">{r.fatigue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Batch evaluation</CardTitle>
                <CardDescription>
                  Runs every row through the rules engine. Each result is appended to db/results.json and db/drivers.json.
                </CardDescription>
              </div>
              <Button
                onClick={handleEvaluate}
                disabled={rows.length === 0 || evaluating}
              >
                {evaluating && <Loader2 className="mr-2 size-4 animate-spin" />}
                Evaluate dataset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {rows.length === 0
                  ? "Upload a dataset before evaluating."
                  : "Run an evaluation to see scored drivers here."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((r, i) => (
                  <ResultCard
                    key={`${r.name}-${i}-${r.timestamp}`}
                    result={r}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
