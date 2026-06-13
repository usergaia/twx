"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiClient } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import {
  ROUTE_OPTIONS,
  WEATHER_OPTIONS,
  type DriverInput,
  type EvaluationResult,
  type Weather,
} from "@/types";

// TODO: once Laravel exposes `GET /api/drivers`, replace the free-text `name`
// and `location` inputs with a select-from-list bound to laravelClient.listDrivers().
// Driver identity is Laravel-owned; only the situational fields below stay client-collected.
// Numeric bounds below are intentionally loose — authoritative validation lives on the AI
// service. Lower bounds remain as obvious typo guards.
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  speed: z.number().min(0),
  route: z.string(),
  weather: z.enum(["clear", "rain", "fog"]),
  fuel: z.number().min(0),
  temperature: z.number().min(-40),
});

type FormValues = z.infer<typeof schema>;

interface DriverEvaluateFormProps {
  onResult: (result: EvaluationResult, input: DriverInput) => void;
}

export function DriverEvaluateForm({ onResult }: DriverEvaluateFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      location: "",
      speed: 60,
      route: "none",
      weather: "clear",
      fuel: 80,
      temperature: 70,
    },
  });

  async function onSubmit(values: FormValues) {
    const payload: DriverInput = {
      ...values,
      route: values.route === "none" ? "" : values.route,
      fatigue: 0,
    };
    try {
      const result = await aiClient.evaluate(payload);
      onResult(result, payload);
      toast.success(`Evaluated ${result.name}: ${result.score} (${result.status})`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : (err as Error).message;
      toast.error(`Evaluation failed: ${message}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Driver name" error={errors.name?.message}>
          <Input placeholder="Alice" {...register("name")} />
        </Field>
        <Field label="Location" error={errors.location?.message}>
          <Input placeholder="HQ" {...register("location")} />
        </Field>
        <Field label="Speed (km/h)" error={errors.speed?.message}>
          <Input type="number" step="1" {...register("speed", { valueAsNumber: true })} />
        </Field>
        <Field label="Fuel (%)" error={errors.fuel?.message}>
          <Input type="number" step="1" {...register("fuel", { valueAsNumber: true })} />
        </Field>
        <Field label="Engine temp (°C)" error={errors.temperature?.message}>
          <Input type="number" step="1" {...register("temperature", { valueAsNumber: true })} />
        </Field>
        <Field label="Route" error={errors.route?.message}>
          <Controller
            control={control}
            name="route"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Weather" error={errors.weather?.message}>
          <Controller
            control={control}
            name="weather"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v as Weather)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Evaluate driver
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
