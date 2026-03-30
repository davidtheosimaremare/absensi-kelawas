import { adminOnly } from "@/lib/admin-check";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper: get a setting value, fallback to env var
async function getSetting(key: string, fallback: string): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function GET() {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  const [latitude, longitude, radius, disableGeo] = await Promise.all([
    getSetting("TARGET_LATITUDE", process.env.TARGET_LATITUDE || ""),
    getSetting("TARGET_LONGITUDE", process.env.TARGET_LONGITUDE || ""),
    getSetting("GEO_RADIUS", "50"),
    getSetting("DISABLE_GEOFENCING", process.env.DISABLE_GEOFENCING || "false"),
  ]);

  return NextResponse.json({ latitude, longitude, radius, disableGeofencing: disableGeo === "true" });
}

export async function POST(req: Request) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  const body = await req.json();

  const updates: { key: string; value: string }[] = [];

  if (body.latitude !== undefined) updates.push({ key: "TARGET_LATITUDE", value: String(body.latitude) });
  if (body.longitude !== undefined) updates.push({ key: "TARGET_LONGITUDE", value: String(body.longitude) });
  if (body.radius !== undefined) updates.push({ key: "GEO_RADIUS", value: String(body.radius) });
  if (body.disableGeofencing !== undefined) updates.push({ key: "DISABLE_GEOFENCING", value: body.disableGeofencing ? "true" : "false" });

  await Promise.all(
    updates.map((u) =>
      prisma.systemSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      })
    )
  );

  return NextResponse.json({ success: true });
}
