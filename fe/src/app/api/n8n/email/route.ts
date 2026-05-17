import { NextRequest, NextResponse } from "next/server";

const N8N_URL = process.env.N8N_URL ?? "http://localhost:5678";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const upstream = await fetch(`${N8N_URL}/webhook/form-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
