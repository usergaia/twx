"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { n8nClient } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import type { WebhookResponse } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  order: z.string().min(1, "Order is required"),
});

type FormValues = z.infer<typeof schema>;

export function EmailTestForm() {
  const [lastResponse, setLastResponse] = useState<WebhookResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", order: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const res = await n8nClient.submitEmailForm(values);
      setLastResponse(res);
      if (res.status === "success") {
        toast.success(res.message ?? "Form submitted");
      } else {
        toast.error(res.message ?? "Webhook returned an error");
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : (err as Error).message;
      toast.error(`Webhook failed: ${message}`);
      setLastResponse(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Name" error={errors.name?.message}>
          <Input placeholder="Edgar" {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="edgar@example.com" {...register("email")} />
        </Field>
        <Field label="Order" error={errors.order?.message}>
          <Input placeholder="Logistics Delivery" {...register("order")} />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Submit
        </Button>
      </form>

      {lastResponse && (
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            Last response
          </div>
          <pre className="overflow-x-auto text-xs">{JSON.stringify(lastResponse, null, 2)}</pre>
        </div>
      )}
    </div>
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
