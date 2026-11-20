import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", environment: process.env.NODE_ENV ?? "unknown", service: "open-frontier-backend" });
}
