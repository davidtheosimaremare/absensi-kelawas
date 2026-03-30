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
    const { latitude, longitude, type, photoData, faceDescriptor } = await req.json(); // type: 'check_in' | 'check_out'

    if (!latitude || !longitude || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Geofencing check
    const disableGeo = process.env.DISABLE_GEOFENCING === "true";
    if (!disableGeo) {
      const targetLat = parseFloat(process.env.TARGET_LATITUDE || "0");
      const targetLong = parseFloat(process.env.TARGET_LONGITUDE || "0");
      const distance = calculateDistance(latitude, longitude, targetLat, targetLong);

      if (distance > 50) {
        return NextResponse.json(
          { error: `Lokasi Anda terlalu jauh dari Resto KELAWAS! Jarak saat ini: ${Math.round(distance)} meter. Pastikan kamu berada di dekat Resto KELAWAS untuk dapat melakukan absensi.` },
          { status: 403 }
        );
      }
    }

    // 2. Schedule check
    const today = new Date();
    const schedule = await prisma.schedule.findUnique({
      where: { date: today },
    });

    if (schedule?.status === "HOLIDAY") {
      return NextResponse.json({ error: "Today is a holiday" }, { status: 403 });
    }

    // 3. Attendance logic
    const userId = (session.user as any).id;
    const dateStr = format(today, "yyyy-MM-dd");

    // Check if attendance already exists for today
    let attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: {
          gte: new Date(dateStr),
          lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (type === "check_in") {
      if (attendance) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
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
        return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
      }
      if (attendance.checkOut) {
        return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: today,
          checkOutPhotoUrl: photoData,
        },
      });
    }

    // Save initial face biometric data whether they registered it during check-in or check-out
    if (faceDescriptor) {
      await prisma.user.update({
        where: { id: userId },
        data: { faceData: faceDescriptor },
      });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit attendance" }, { status: 500 });
  }
}
