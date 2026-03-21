import { adminOnly } from "@/lib/admin-check";
import { NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    latitude: process.env.TARGET_LATITUDE,
    longitude: process.env.TARGET_LONGITUDE,
  });
}
