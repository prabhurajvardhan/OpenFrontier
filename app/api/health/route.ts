import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", environment: "development", service: "open-frontier-backend" });
}
