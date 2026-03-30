import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateDistance } from "@/utils/geo";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { latitude, longitude, type, photoData, faceDescriptor } = await req.json();

    if (!latitude || !longitude || !type) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Geofencing check — safely try reading from DB, fallback to env
    try {
      const [geoDisabledRow, targetLatRow, targetLongRow, radiusRow] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: "DISABLE_GEOFENCING" } }),
        prisma.systemSetting.findUnique({ where: { key: "TARGET_LATITUDE" } }),
        prisma.systemSetting.findUnique({ where: { key: "TARGET_LONGITUDE" } }),
        prisma.systemSetting.findUnique({ where: { key: "GEO_RADIUS" } }),
      ]);

      const disableGeo =
        (geoDisabledRow?.value ?? process.env.DISABLE_GEOFENCING ?? "false") === "true";

      if (!disableGeo) {
        const targetLat = parseFloat(targetLatRow?.value ?? process.env.TARGET_LATITUDE ?? "0");
        const targetLong = parseFloat(targetLongRow?.value ?? process.env.TARGET_LONGITUDE ?? "0");
        const radius = parseFloat(radiusRow?.value ?? "50");
        const distance = calculateDistance(latitude, longitude, targetLat, targetLong);

        if (distance > radius) {
          return NextResponse.json(
            { error: `Lokasi Anda terlalu jauh dari Resto KELAWAS! Jarak saat ini: ${Math.round(distance)} meter. Pastikan kamu berada di dekat Resto KELAWAS untuk dapat melakukan absensi.` },
            { status: 403 }
          );
        }
      }
    } catch (geoErr) {
      // If DB setting fails, fallback to env var check
      console.warn("Geofencing DB read failed, falling back to env:", geoErr);
      const disableGeo = process.env.DISABLE_GEOFENCING === "true";
      if (!disableGeo) {
        const targetLat = parseFloat(process.env.TARGET_LATITUDE ?? "0");
        const targetLong = parseFloat(process.env.TARGET_LONGITUDE ?? "0");
        const distance = calculateDistance(latitude, longitude, targetLat, targetLong);
        if (distance > 50) {
          return NextResponse.json(
            { error: `Lokasi Anda terlalu jauh dari Resto KELAWAS! Jarak saat ini: ${Math.round(distance)} meter.` },
            { status: 403 }
          );
        }
      }
    }

    // 2. Schedule check — use date string to avoid timezone issues
    const today = new Date();
    const dateStr = format(today, "yyyy-MM-dd");
    const dayStart = new Date(dateStr + "T00:00:00.000Z");
    const dayEnd = new Date(dateStr + "T23:59:59.999Z");

    const schedule = await prisma.schedule.findFirst({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (schedule?.status === "HOLIDAY") {
      return NextResponse.json({ error: "Hari ini adalah hari libur, absensi tidak dapat dilakukan." }, { status: 403 });
    }

    // 3. Attendance logic
    const userId = (session.user as any).id;

    // Check if attendance already exists for today
    let attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: {
          gte: new Date(dateStr + "T00:00:00.000Z"),
          lt: new Date(dateStr + "T23:59:59.999Z"),
        },
      },
    });

    if (type === "check_in") {
      if (attendance) {
        return NextResponse.json({ error: "Anda sudah absen masuk hari ini." }, { status: 400 });
      }

      attendance = await prisma.attendance.create({
        data: {
          userId,
          checkIn: today,
          latitude,
          longitude,
          status: "PRESENT",
          checkInPhotoUrl: photoData,
        },
      });
    } else if (type === "check_out") {
      if (!attendance) {
        return NextResponse.json({ error: "Anda belum absen masuk hari ini." }, { status: 400 });
      }
      if (attendance.checkOut) {
        return NextResponse.json({ error: "Anda sudah absen pulang hari ini." }, { status: 400 });
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: today,
          checkOutPhotoUrl: photoData,
        },
      });
    }

    // Save face biometric data if provided (first time registration)
    if (faceDescriptor) {
      await prisma.user.update({
        where: { id: userId },
        data: { faceData: faceDescriptor },
      });
    }

    return NextResponse.json(attendance);
  } catch (error: any) {
    console.error("Attendance error:", error?.message ?? error);
    return NextResponse.json(
      { error: `Gagal menyimpan absensi: ${error?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
